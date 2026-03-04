-- Fix avatar_url sync triggers to treat empty strings as NULL.
-- COALESCE('', 'https://...') returns '' because '' is non-null.
-- This caused OAuth avatars to be lost when auth.users was initially
-- created with avatar_url='' before the full OAuth profile arrived.

-- Fix the INSERT trigger (new signups)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, github_username)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      NULLIF(new.raw_user_meta_data ->> 'full_name', ''),
      NULLIF(new.raw_user_meta_data ->> 'name', '')
    ),
    COALESCE(
      NULLIF(new.raw_user_meta_data ->> 'avatar_url', ''),
      NULLIF(new.raw_user_meta_data ->> 'picture', '')
    ),
    new.raw_user_meta_data ->> 'user_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the UPDATE trigger (OAuth profile populated after signup)
CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS trigger AS $$
BEGIN
  UPDATE public.users
  SET
    full_name = COALESCE(
      NULLIF(public.users.full_name, ''),
      NULLIF(new.raw_user_meta_data ->> 'full_name', ''),
      NULLIF(new.raw_user_meta_data ->> 'name', '')
    ),
    avatar_url = COALESCE(
      NULLIF(public.users.avatar_url, ''),
      NULLIF(new.raw_user_meta_data ->> 'avatar_url', ''),
      NULLIF(new.raw_user_meta_data ->> 'picture', '')
    )
  WHERE id = new.id;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill: fix existing users with empty-string avatar_url
-- Pull the correct URL from auth.users metadata
UPDATE public.users u
SET avatar_url = COALESCE(
  NULLIF(au.raw_user_meta_data ->> 'avatar_url', ''),
  NULLIF(au.raw_user_meta_data ->> 'picture', '')
)
FROM auth.users au
WHERE au.id = u.id
  AND (u.avatar_url = '' OR u.avatar_url IS NULL)
  AND (
    NULLIF(au.raw_user_meta_data ->> 'avatar_url', '') IS NOT NULL
    OR NULLIF(au.raw_user_meta_data ->> 'picture', '') IS NOT NULL
  );
