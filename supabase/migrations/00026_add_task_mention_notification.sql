-- Add 'task_mention' to notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_mention';

-- Update default notification preferences trigger to include task_mentions
CREATE OR REPLACE FUNCTION set_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.notification_preferences IS NULL THEN
    NEW.notification_preferences = jsonb_build_object(
      'comments', true,
      'votes', true,
      'collaborators', true,
      'status_changes', true,
      'task_mentions', true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing users: add task_mentions = true to their preferences
UPDATE users
SET notification_preferences = notification_preferences || '{"task_mentions": true}'::jsonb
WHERE NOT (notification_preferences ? 'task_mentions');
