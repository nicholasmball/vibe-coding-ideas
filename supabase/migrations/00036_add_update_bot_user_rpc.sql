-- SECURITY DEFINER function to update a bot user's public.users row
-- Needed because RLS on users only allows auth.uid() = id (owner can't update bot's row)
CREATE OR REPLACE FUNCTION public.update_bot_user(
  p_bot_id uuid,
  p_owner_id uuid,
  p_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate the bot exists, is a bot, and is owned by the caller
  IF NOT EXISTS (
    SELECT 1 FROM public.bot_profiles
    WHERE id = p_bot_id AND owner_id = p_owner_id
  ) THEN
    RAISE EXCEPTION 'Bot not found or not owned by you';
  END IF;

  -- Update public.users to sync name and avatar
  IF p_name IS NOT NULL THEN
    UPDATE public.users SET full_name = p_name WHERE id = p_bot_id;
  END IF;

  IF p_avatar_url IS NOT NULL THEN
    UPDATE public.users SET avatar_url = p_avatar_url WHERE id = p_bot_id;
  END IF;
END;
$$;
