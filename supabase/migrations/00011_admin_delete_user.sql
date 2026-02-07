-- Add 'user_deleted' to the notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'user_deleted';

-- Make notifications.idea_id nullable and change FK to ON DELETE SET NULL
ALTER TABLE notifications ALTER COLUMN idea_id DROP NOT NULL;

ALTER TABLE notifications DROP CONSTRAINT notifications_idea_id_fkey;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_idea_id_fkey
  FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE SET NULL;

-- RPC function to delete a user (security definer runs as the DB owner)
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  caller_is_admin boolean;
  target_is_admin boolean;
BEGIN
  -- Get the caller's ID from the JWT
  caller_id := auth.uid();

  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if the caller is an admin
  SELECT is_admin INTO caller_is_admin
  FROM public.users
  WHERE id = caller_id;

  IF NOT COALESCE(caller_is_admin, false) THEN
    RAISE EXCEPTION 'Not authorized: only admins can delete users';
  END IF;

  -- Prevent deleting self
  IF caller_id = target_user_id THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;

  -- Prevent deleting other admins
  SELECT is_admin INTO target_is_admin
  FROM public.users
  WHERE id = target_user_id;

  IF target_is_admin IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF target_is_admin THEN
    RAISE EXCEPTION 'Cannot delete another admin';
  END IF;

  -- Delete from auth.users — this cascades to public.users via the trigger,
  -- which then cascades to ideas, comments, votes, collaborators, etc.
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
