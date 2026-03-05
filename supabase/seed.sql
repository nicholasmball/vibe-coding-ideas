-- Seed local dev database with admin, guest, agents, and demo project.
-- Runs automatically after migrations via `npx supabase db reset`.
--
-- Admin:  admin@example.com / AdminPass123
-- Guest:  guest@example.com / GuestPass123

-- ============================================================================
-- 1. Users
-- ============================================================================

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
-- 2. Agent Bots (owned by admin)
-- ============================================================================

-- Helper to insert a bot user + profile
-- Bot IDs use a3333333-3333-4333-a333-33333333330X pattern

-- Bot 1: Product Owner
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a3333333-3333-4333-a333-333333333301',
  'authenticated', 'authenticated',
  'bot-product-owner@vibecodes.local', '', now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Product Owner"}',
  now(), now(), '', '', '', '', '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Bot 2: UX Designer
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a3333333-3333-4333-a333-333333333302',
  'authenticated', 'authenticated',
  'bot-ux-designer@vibecodes.local', '', now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "UX Designer"}',
  now(), now(), '', '', '', '', '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Bot 3: Frontend Engineer
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a3333333-3333-4333-a333-333333333303',
  'authenticated', 'authenticated',
  'bot-frontend@vibecodes.local', '', now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Frontend Engineer"}',
  now(), now(), '', '', '', '', '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Bot 4: QA Engineer
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token,
  email_change, email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a3333333-3333-4333-a333-333333333304',
  'authenticated', 'authenticated',
  'bot-qa@vibecodes.local', '', now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "QA Engineer"}',
  now(), now(), '', '', '', '', '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Mark all bots
SELECT set_config('app.trusted_bot_operation', 'true', true);
UPDATE public.users SET full_name = 'Product Owner', is_bot = true WHERE id = 'a3333333-3333-4333-a333-333333333301';
UPDATE public.users SET full_name = 'UX Designer',    is_bot = true WHERE id = 'a3333333-3333-4333-a333-333333333302';
UPDATE public.users SET full_name = 'Frontend Engineer', is_bot = true WHERE id = 'a3333333-3333-4333-a333-333333333303';
UPDATE public.users SET full_name = 'QA Engineer',    is_bot = true WHERE id = 'a3333333-3333-4333-a333-333333333304';
SELECT set_config('app.trusted_bot_operation', '', true);

-- Bot profiles
INSERT INTO public.bot_profiles (id, owner_id, name, role, system_prompt, is_active) VALUES
(
  'a3333333-3333-4333-a333-333333333301',
  'a1111111-1111-4111-a111-111111111111',
  'Product Owner', 'Product Manager',
  'You are a Product Owner agent. You prioritise features based on user value, define acceptance criteria, and ensure the team is building the right thing. Keep responses concise and actionable.',
  true
),
(
  'a3333333-3333-4333-a333-333333333302',
  'a1111111-1111-4111-a111-111111111111',
  'UX Designer', 'UX Designer',
  'You are a UX Designer agent. You design intuitive interfaces, create component specs, and ensure accessibility. When completing a step, provide structured specs that a developer can implement directly.',
  true
),
(
  'a3333333-3333-4333-a333-333333333303',
  'a1111111-1111-4111-a111-111111111111',
  'Frontend Engineer', 'Frontend Engineer',
  'You are a Frontend Engineer agent. You implement React components, write clean TypeScript, and follow best practices. When completing a step, include the full code changes as your output.',
  true
),
(
  'a3333333-3333-4333-a333-333333333304',
  'a1111111-1111-4111-a111-111111111111',
  'QA Engineer', 'QA Engineer',
  'You are a QA Engineer agent. You verify features work correctly, check edge cases, and test accessibility. When completing a step, list what you tested and the results.',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. Demo Idea: Counter App
-- ============================================================================

INSERT INTO public.ideas (
  id, title, description, author_id, status, visibility, tags
) VALUES (
  'b1111111-1111-4111-b111-111111111111',
  'Demo Counter App',
  E'A simple React counter app for testing the VibeCodes agent workflow pipeline.\n\n## Overview\nMinimal Vite + React + TypeScript app in the `demo/` folder with increment/decrement buttons.\n\n## Purpose\nSandbox for testing:\n- Discussion to task conversion via Orchestration Agent\n- Multi-agent workflow step execution\n- Inter-agent communication via step comments\n- Output and failure handling in the unified thread\n\n## Tech Stack\n- Vite, React 18, TypeScript, plain CSS',
  'a1111111-1111-4111-a111-111111111111',
  'in_progress',
  'public',
  ARRAY['demo', 'testing', 'workflow', 'react']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. Board Columns for the demo idea
-- ============================================================================

INSERT INTO public.board_columns (id, idea_id, title, position, is_done_column) VALUES
  ('cc111111-1111-4111-8111-000000000001', 'b1111111-1111-4111-b111-111111111111', 'Backlog',                      0,    false),
  ('cc111111-1111-4111-8111-000000000002', 'b1111111-1111-4111-b111-111111111111', 'To Do',                     1000,    false),
  ('cc111111-1111-4111-8111-000000000003', 'b1111111-1111-4111-b111-111111111111', 'Blocked/Requires User Input', 2000,  false),
  ('cc111111-1111-4111-8111-000000000004', 'b1111111-1111-4111-b111-111111111111', 'In Progress',               3000,    false),
  ('cc111111-1111-4111-8111-000000000005', 'b1111111-1111-4111-b111-111111111111', 'Verify',                    4000,    false),
  ('cc111111-1111-4111-8111-000000000006', 'b1111111-1111-4111-b111-111111111111', 'Done',                      5000,    true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. Allocate agents to the idea pool
-- ============================================================================

INSERT INTO public.idea_agents (idea_id, bot_id, added_by) VALUES
  ('b1111111-1111-4111-b111-111111111111', 'a3333333-3333-4333-a333-333333333301', 'a1111111-1111-4111-a111-111111111111'),
  ('b1111111-1111-4111-b111-111111111111', 'a3333333-3333-4333-a333-333333333302', 'a1111111-1111-4111-a111-111111111111'),
  ('b1111111-1111-4111-b111-111111111111', 'a3333333-3333-4333-a333-333333333303', 'a1111111-1111-4111-a111-111111111111'),
  ('b1111111-1111-4111-b111-111111111111', 'a3333333-3333-4333-a333-333333333304', 'a1111111-1111-4111-a111-111111111111')
ON CONFLICT DO NOTHING;

-- Set the Orchestration Agent (from migration 00067) as orchestrator
UPDATE public.idea_agents
SET is_orchestrator = true
WHERE idea_id = 'b1111111-1111-4111-b111-111111111111'
  AND bot_id = 'b0000000-0000-4000-a000-000000000016';

-- Also allocate the orchestration agent to the pool if not already there
INSERT INTO public.idea_agents (idea_id, bot_id, added_by, is_orchestrator) VALUES
  ('b1111111-1111-4111-b111-111111111111', 'b0000000-0000-4000-a000-000000000016', 'a1111111-1111-4111-a111-111111111111', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. Discussion: ready to convert (tests the full orchestration flow)
-- ============================================================================

INSERT INTO public.idea_discussions (
  id, idea_id, author_id, title, body, status, target_column_id
) VALUES (
  'c1111111-1111-4111-8111-111111111111',
  'b1111111-1111-4111-b111-111111111111',
  'a1111111-1111-4111-a111-111111111111',
  'Add a reset button to the counter',
  E'The counter app currently only has increment and decrement buttons. We should add a reset button that sets the count back to zero.\n\n### Requirements\n- New "Reset" button between the - and + buttons\n- Only enabled when count is not zero\n- Styled consistently with existing buttons but visually distinct (maybe a different colour)\n- Should be keyboard accessible',
  'ready_to_convert',
  'cc111111-1111-4111-8111-000000000002'  -- target: "To Do" column
) ON CONFLICT (id) DO NOTHING;

-- Reply: UX Designer weighs in
INSERT INTO public.idea_discussion_replies (
  id, discussion_id, author_id, content
) VALUES (
  'd1111111-1111-4111-9111-111111111111',
  'c1111111-1111-4111-8111-111111111111',
  'a3333333-3333-4333-a333-333333333302',
  E'Good idea. I suggest making the reset button slightly smaller and using a muted colour (e.g. zinc/gray) so it doesn''t compete with the primary +/- actions. We could also add a subtle fade-in animation when count !== 0 to draw attention to it becoming available.'
) ON CONFLICT (id) DO NOTHING;

-- Reply: Frontend Engineer confirms approach
INSERT INTO public.idea_discussion_replies (
  id, discussion_id, author_id, content
) VALUES (
  'd1111111-1111-4111-9111-222222222222',
  'c1111111-1111-4111-8111-111111111111',
  'a3333333-3333-4333-a333-333333333303',
  E'Straightforward to implement. I''ll add a `disabled` prop when count === 0 and use CSS opacity for the visual feedback. The existing `.counter` flex layout already has room for a third button.'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. A second discussion (open, for conversation testing)
-- ============================================================================

INSERT INTO public.idea_discussions (
  id, idea_id, author_id, title, body, status
) VALUES (
  'c2222222-2222-4222-8222-222222222222',
  'b1111111-1111-4111-b111-111111111111',
  'a1111111-1111-4111-a111-111111111111',
  'Should we add a step counter / history?',
  E'Once the reset button is done, it might be nice to track the history of changes. For example:\n- Show the number of increments/decrements performed\n- Or keep a small log of the last N actions\n\nThis would be a good follow-up feature to test more complex workflow steps. Let''s discuss the scope here first.',
  'open'
) ON CONFLICT (id) DO NOTHING;
