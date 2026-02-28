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

INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) VALUES (
  'a1111111-1111-4111-a111-111111111111',
  'a1111111-1111-4111-a111-111111111111',
  'a1111111-1111-4111-a111-111111111111',
  'email',
  '{"sub": "a1111111-1111-4111-a111-111111111111", "email": "admin@example.com", "email_verified": true}',
  now(), now(), now()
) ON CONFLICT (provider_id, provider) DO NOTHING;

-- The handle_new_user trigger creates the public.users row automatically.
-- Now grant admin privileges.
-- Must bypass prevent_privilege_escalation trigger (auth.uid() is null during seed).
SELECT set_config('app.trusted_bot_operation', 'true', true);
UPDATE public.users
SET is_admin = true, ai_enabled = true
WHERE id = 'a1111111-1111-4111-a111-111111111111';
SELECT set_config('app.trusted_bot_operation', '', true);

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

INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
) VALUES (
  'a2222222-2222-4222-a222-222222222222',
  'a2222222-2222-4222-a222-222222222222',
  'a2222222-2222-4222-a222-222222222222',
  'email',
  '{"sub": "a2222222-2222-4222-a222-222222222222", "email": "guest@example.com", "email_verified": true}',
  now(), now(), now()
) ON CONFLICT (provider_id, provider) DO NOTHING;

UPDATE public.users
SET full_name = 'Guest User'
WHERE id = 'a2222222-2222-4222-a222-222222222222';

-- ============================================================================
-- Seed Product Owner agent (owned by admin)
-- ============================================================================

-- Create auth.users row first (handle_new_user trigger auto-creates public.users)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a3333333-3333-4333-a333-333333333333',
  'authenticated', 'authenticated',
  'bot-product-owner@vibecodes.local',
  '',
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Product Owner"}',
  now(), now(),
  '', '',
  '', '', '',
  '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Mark as bot (bypass prevent_privilege_escalation trigger)
SELECT set_config('app.trusted_bot_operation', 'true', true);
UPDATE public.users
SET full_name = 'Product Owner', is_bot = true
WHERE id = 'a3333333-3333-4333-a333-333333333333';
SELECT set_config('app.trusted_bot_operation', '', true);

INSERT INTO public.bot_profiles (id, owner_id, name, role, system_prompt, is_active)
VALUES (
  'a3333333-3333-4333-a333-333333333333',
  'a1111111-1111-4111-a111-111111111111',  -- owned by admin (visible in web UI Agents page)
  'Product Owner',
  'Product Owner',
  'You are a Product Owner agent. You prioritise features based on user value, define acceptance criteria, and ensure the team is building the right thing. When asked for input on discussions, focus on user impact, scope, and whether the proposed approach aligns with the product vision. Keep responses concise and actionable.',
  true
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Seed idea with a discussion and reply
-- ============================================================================

-- Create a public idea owned by admin
INSERT INTO public.ideas (
  id, title, description, author_id, status, visibility, tags
) VALUES (
  'b1111111-1111-4111-b111-111111111111',
  'Add dark mode toggle to settings page',
  'We should add a dark mode toggle to the settings page so users can switch between light and dark themes.

## Motivation

Many users have requested a dark mode option. This would improve accessibility and reduce eye strain for users who prefer darker interfaces.

## Proposed approach

1. Add a theme toggle component to the settings page
2. Persist the preference in the user profile
3. Use `next-themes` to handle theme switching',
  'a1111111-1111-4111-a111-111111111111',
  'open',
  'public',
  ARRAY['feature', 'ui', 'accessibility']
) ON CONFLICT (id) DO NOTHING;

-- Create a discussion on the idea
INSERT INTO public.idea_discussions (
  id, idea_id, author_id, title, body
) VALUES (
  'c1111111-1111-4111-8111-111111111111',
  'b1111111-1111-4111-b111-111111111111',
  'a1111111-1111-4111-a111-111111111111',
  'Should we support system preference detection?',
  'Before we build the toggle, we should decide whether to also detect the OS-level dark mode preference automatically.

### Option A — Manual toggle only
Simple toggle in settings. User explicitly picks light or dark.

### Option B — System + manual override
Default to the OS preference via `prefers-color-scheme`, but let users override it in settings.

I lean towards **Option B** since `next-themes` supports this out of the box with the `system` theme value.'
) ON CONFLICT (id) DO NOTHING;

-- Reply 1: admin agrees with Option B
INSERT INTO public.idea_discussion_replies (
  id, discussion_id, author_id, content
) VALUES (
  'd1111111-1111-4111-9111-111111111111',
  'c1111111-1111-4111-8111-111111111111',
  'a1111111-1111-4111-a111-111111111111',
  'Good point — Option B is definitely the way to go. We already have `next-themes` installed so supporting the `system` value is essentially free. We just need to make sure the toggle has three states: Light, Dark, and System.'
) ON CONFLICT (id) DO NOTHING;

