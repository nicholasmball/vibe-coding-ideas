-- Fix bot user UUID to be RFC 4122 v4 compliant
-- Old: a0000000-0000-0000-0000-000000000001 (invalid: version=0, variant=0)
-- New: a0000000-0000-4000-a000-000000000001 (valid: version=4, variant=a)
--
-- The MCP SDK validates UUID parameters with a strict regex requiring
-- version bits [1-8] and variant bits [89abAB]. The old synthetic UUID
-- fails this validation, preventing bot assignment via MCP tools.

BEGIN;

-- Disable FK constraint enforcement for the duration of this migration
SET session_replication_role = 'replica';

-- Update auth.users (root)
UPDATE auth.users
SET id = 'a0000000-0000-4000-a000-000000000001'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Update public.users (references auth.users)
UPDATE public.users
SET id = 'a0000000-0000-4000-a000-000000000001'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Update mcp_oauth_codes (references auth.users)
UPDATE public.mcp_oauth_codes
SET user_id = 'a0000000-0000-4000-a000-000000000001'
WHERE user_id = 'a0000000-0000-0000-0000-000000000001';

-- Update bot_profiles (id and owner_id reference public.users)
UPDATE public.bot_profiles
SET id = 'a0000000-0000-4000-a000-000000000001',
    owner_id = 'a0000000-0000-4000-a000-000000000001'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Update users.active_bot_id (references bot_profiles)
UPDATE public.users
SET active_bot_id = 'a0000000-0000-4000-a000-000000000001'
WHERE active_bot_id = 'a0000000-0000-0000-0000-000000000001';

-- Update ideas
UPDATE public.ideas
SET author_id = 'a0000000-0000-4000-a000-000000000001'
WHERE author_id = 'a0000000-0000-0000-0000-000000000001';

-- Update comments
UPDATE public.comments
SET author_id = 'a0000000-0000-4000-a000-000000000001'
WHERE author_id = 'a0000000-0000-0000-0000-000000000001';

-- Update collaborators
UPDATE public.collaborators
SET user_id = 'a0000000-0000-4000-a000-000000000001'
WHERE user_id = 'a0000000-0000-0000-0000-000000000001';

-- Update votes
UPDATE public.votes
SET user_id = 'a0000000-0000-4000-a000-000000000001'
WHERE user_id = 'a0000000-0000-0000-0000-000000000001';

-- Update notifications (two columns)
UPDATE public.notifications
SET user_id = 'a0000000-0000-4000-a000-000000000001'
WHERE user_id = 'a0000000-0000-0000-0000-000000000001';

UPDATE public.notifications
SET actor_id = 'a0000000-0000-4000-a000-000000000001'
WHERE actor_id = 'a0000000-0000-0000-0000-000000000001';

-- Update board_tasks
UPDATE public.board_tasks
SET assignee_id = 'a0000000-0000-4000-a000-000000000001'
WHERE assignee_id = 'a0000000-0000-0000-0000-000000000001';

-- Update board_task_activity
UPDATE public.board_task_activity
SET actor_id = 'a0000000-0000-4000-a000-000000000001'
WHERE actor_id = 'a0000000-0000-0000-0000-000000000001';

-- Update board_task_comments
UPDATE public.board_task_comments
SET author_id = 'a0000000-0000-4000-a000-000000000001'
WHERE author_id = 'a0000000-0000-0000-0000-000000000001';

-- Update board_task_attachments
UPDATE public.board_task_attachments
SET uploaded_by = 'a0000000-0000-4000-a000-000000000001'
WHERE uploaded_by = 'a0000000-0000-0000-0000-000000000001';

-- Re-enable FK constraint enforcement
SET session_replication_role = 'origin';

-- Update delete_bot_user function to reference the new UUID
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
  IF p_bot_id = 'a0000000-0000-4000-a000-000000000001' THEN
    RAISE EXCEPTION 'Cannot delete the default bot';
  END IF;

  -- Delete from auth.users — cascades to public.users → bot_profiles
  DELETE FROM auth.users WHERE id = p_bot_id;
END;
$$;

COMMIT;
