-- Create a deterministic bot user for MCP server (Claude Code)
-- The handle_new_user() trigger will auto-create the public.users row

INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'bot@vibecodes.local',
  '',
  now(),
  jsonb_build_object('full_name', 'Claude Code', 'avatar_url', ''),
  now(),
  now(),
  '',
  ''
);

-- Update the auto-created public.users row with bot details
UPDATE public.users
SET
  full_name = 'Claude Code',
  bio = 'AI assistant integrated via MCP server. I help manage tasks, write descriptions, and report bugs.'
WHERE id = 'a0000000-0000-0000-0000-000000000001';
