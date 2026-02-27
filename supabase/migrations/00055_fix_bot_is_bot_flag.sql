-- Fix: prevent_privilege_escalation trigger was silently resetting is_bot = false
-- when create_bot_user (SECURITY DEFINER) tried to UPDATE public.users.
--
-- Root cause: SECURITY DEFINER changes the execution role but auth.uid() still
-- returns the human caller's ID (session variables survive). The trigger sees a
-- non-admin caller and resets is_bot := OLD.is_bot (false). Every bot created by
-- a non-admin user after migration 00050 has is_bot = false.
--
-- Fix: Trusted SECURITY DEFINER functions set a session flag before updating
-- sensitive columns. The trigger respects this flag.

-- 1. Update the privilege escalation trigger to respect a bypass flag
CREATE OR REPLACE FUNCTION public.prevent_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin boolean;
BEGIN
  -- Allow trusted SECURITY DEFINER functions to bypass this check.
  -- The flag is set with LOCAL scope (transaction-only) so it cannot leak.
  IF current_setting('app.trusted_bot_operation', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Check if the caller (real auth user) is an admin
  SELECT COALESCE(u.is_admin, false) INTO caller_is_admin
  FROM public.users u
  WHERE u.id = auth.uid();

  -- Non-admins cannot modify sensitive columns
  IF NOT COALESCE(caller_is_admin, false) THEN
    NEW.is_admin := OLD.is_admin;
    NEW.is_bot := OLD.is_bot;
    NEW.ai_enabled := OLD.ai_enabled;
    NEW.ai_daily_limit := OLD.ai_daily_limit;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Update create_bot_user to set the bypass flag before the UPDATE
CREATE OR REPLACE FUNCTION public.create_bot_user(
  p_name text,
  p_owner_id uuid,
  p_role text DEFAULT NULL,
  p_system_prompt text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bot_id uuid := gen_random_uuid();
  v_email text := 'bot-' || v_bot_id || '@vibecodes.local';
BEGIN
  -- Validate name length
  IF char_length(p_name) > 100 THEN
    RAISE EXCEPTION 'Bot name must be 100 characters or less';
  END IF;

  -- 1. Insert into auth.users (required FK for public.users)
  --    The handle_new_user() trigger auto-creates the public.users row
  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token
  ) VALUES (
    v_bot_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    '',
    now(),
    jsonb_build_object('full_name', p_name, 'avatar_url', coalesce(p_avatar_url, '')),
    now(),
    now(),
    '',
    ''
  );

  -- 2. Set bypass flag so prevent_privilege_escalation allows is_bot update.
  --    LOCAL scope = only lasts for this transaction.
  PERFORM set_config('app.trusted_bot_operation', 'true', true);

  -- 3. Update the auto-created public.users row to set bot flag
  UPDATE public.users
  SET is_bot = true, avatar_url = p_avatar_url
  WHERE id = v_bot_id;

  -- 4. Clear the bypass flag immediately
  PERFORM set_config('app.trusted_bot_operation', '', true);

  -- 5. Insert bot profile
  INSERT INTO public.bot_profiles (id, owner_id, name, role, system_prompt, avatar_url)
  VALUES (v_bot_id, p_owner_id, p_name, p_role, p_system_prompt, p_avatar_url);

  RETURN v_bot_id;
END;
$$;

-- 3. Fix existing bot users that have is_bot = false due to this bug.
--    Any user with a row in bot_profiles should have is_bot = true.
--    Must set the bypass flag because this UPDATE also triggers prevent_privilege_escalation.
SELECT set_config('app.trusted_bot_operation', 'true', true);

UPDATE public.users u
SET is_bot = true
FROM public.bot_profiles bp
WHERE bp.id = u.id
  AND u.is_bot = false;

SELECT set_config('app.trusted_bot_operation', '', true);
