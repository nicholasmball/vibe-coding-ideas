-- Seed local dev database with admin and guest users.
-- Runs automatically after migrations via `npx supabase db reset`.
--
-- Admin:  admin@example.com / AdminPass123
-- Guest:  guest@example.com / GuestPass123

-- Admin user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1111111-1111-4111-a111-111111111111',
  'authenticated', 'authenticated',
  'admin@example.com',
  crypt('AdminPass123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"email_verified": true}',
  now(), now(),
  '', '',
  '', '', '',
  '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- The handle_new_user trigger creates the public.users row automatically.
-- Now grant admin privileges.
UPDATE public.users
SET is_admin = true, ai_enabled = true
WHERE id = 'a1111111-1111-4111-a111-111111111111';

-- Guest user
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a2222222-2222-4222-a222-222222222222',
  'authenticated', 'authenticated',
  'guest@example.com',
  crypt('GuestPass123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"email_verified": true}',
  now(), now(),
  '', '',
  '', '', '',
  '', '', ''
) ON CONFLICT (id) DO NOTHING;

UPDATE public.users
SET full_name = 'Guest User'
WHERE id = 'a2222222-2222-4222-a222-222222222222';
