-- Fix create_bot_user: must insert into auth.users first (public.users.id references auth.users)
-- The on_auth_user_created trigger auto-creates the public.users row from auth.users metadata

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

  -- 2. Update the auto-created public.users row to set bot flag
  UPDATE public.users
  SET is_bot = true, avatar_url = p_avatar_url
  WHERE id = v_bot_id;

  -- 3. Insert bot profile
  INSERT INTO public.bot_profiles (id, owner_id, name, role, system_prompt, avatar_url)
  VALUES (v_bot_id, p_owner_id, p_name, p_role, p_system_prompt, p_avatar_url);

  RETURN v_bot_id;
END;
$$;

-- Fix delete_bot_user: delete from auth.users (cascades to public.users → bot_profiles)
CREATE OR REPLACE FUNCTION public.delete_bot_user(
  p_bot_id uuid,
  p_owner_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate the bot exists and is owned by the caller
  IF NOT EXISTS (
    SELECT 1 FROM public.bot_profiles
    WHERE id = p_bot_id AND owner_id = p_owner_id
  ) THEN
    RAISE EXCEPTION 'Bot not found or not owned by you';
  END IF;

  -- Prevent deleting the default bot
  IF p_bot_id = 'a0000000-0000-0000-0000-000000000001' THEN
    RAISE EXCEPTION 'Cannot delete the default bot';
  END IF;

  -- Delete from auth.users — cascades to public.users → bot_profiles
  DELETE FROM auth.users WHERE id = p_bot_id;
END;
$$;
