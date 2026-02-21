-- Fix column default to include task_mentions (was missing, causing new users to not receive mention notifications)
ALTER TABLE users ALTER COLUMN notification_preferences
  SET DEFAULT '{"comments": true, "votes": true, "collaborators": true, "status_changes": true, "task_mentions": true}'::jsonb;

-- Backfill users missing task_mentions key
UPDATE users
SET notification_preferences = notification_preferences || '{"task_mentions": true}'::jsonb
WHERE NOT (notification_preferences ? 'task_mentions');
