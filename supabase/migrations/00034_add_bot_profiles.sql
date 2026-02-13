-- Add is_bot flag to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_bot boolean DEFAULT false;

-- Mark existing bot user
UPDATE public.users SET is_bot = true WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Create bot_profiles table
CREATE TABLE IF NOT EXISTS public.bot_profiles (
  id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) <= 100),
  role text CHECK (role IS NULL OR char_length(role) <= 50),
  system_prompt text CHECK (system_prompt IS NULL OR char_length(system_prompt) <= 10000),
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on owner_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_bot_profiles_owner_id ON public.bot_profiles(owner_id);

-- Insert profile for existing bot user (owned by itself since it has no human owner)
INSERT INTO public.bot_profiles (id, owner_id, name, role, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Claude Code',
  'Developer',
  true
) ON CONFLICT (id) DO NOTHING;

-- SECURITY DEFINER function to create a bot user
-- This inserts into both users and bot_profiles atomically
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

  -- Insert into users table
  INSERT INTO public.users (id, email, full_name, avatar_url, is_bot)
  VALUES (v_bot_id, v_email, p_name, p_avatar_url, true);

  -- Insert into bot_profiles table
  INSERT INTO public.bot_profiles (id, owner_id, name, role, system_prompt, avatar_url)
  VALUES (v_bot_id, p_owner_id, p_name, p_role, p_system_prompt, p_avatar_url);

  RETURN v_bot_id;
END;
$$;

-- SECURITY DEFINER function to delete a bot user
-- Validates ownership before deletion
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

  -- Delete from users (cascades to bot_profiles and all FKs)
  DELETE FROM public.users WHERE id = p_bot_id;
END;
$$;

-- Enable RLS on bot_profiles
ALTER TABLE public.bot_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated users can see bot profiles
CREATE POLICY "bot_profiles_select" ON public.bot_profiles
  FOR SELECT TO authenticated
  USING (true);

-- UPDATE: only the owner can update their bot profiles
CREATE POLICY "bot_profiles_update" ON public.bot_profiles
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- INSERT and DELETE are handled via SECURITY DEFINER functions above
-- No direct INSERT/DELETE policies needed (the functions bypass RLS)

-- Add updated_at trigger for bot_profiles
CREATE OR REPLACE FUNCTION public.update_bot_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER bot_profiles_updated_at
  BEFORE UPDATE ON public.bot_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bot_profiles_updated_at();
