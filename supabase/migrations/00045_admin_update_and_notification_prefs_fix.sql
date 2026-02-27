-- Allow admins to update any user's profile (for AI toggle, daily limit, etc.)
-- The existing policy only allows auth.uid() = id, so admin updates to other
-- users silently fail (RLS filters out non-matching rows with no error).
CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );

-- === 00045_fix_notification_preferences_default ===

-- Fix column default to include task_mentions (was missing, causing new users to not receive mention notifications)
ALTER TABLE users ALTER COLUMN notification_preferences
  SET DEFAULT '{"comments": true, "votes": true, "collaborators": true, "status_changes": true, "task_mentions": true}'::jsonb;

-- Backfill users missing task_mentions key
UPDATE users
SET notification_preferences = notification_preferences || '{"task_mentions": true}'::jsonb
WHERE NOT (notification_preferences ? 'task_mentions');
