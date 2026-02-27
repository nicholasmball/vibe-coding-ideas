-- Add discussion_mention to notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'discussion_mention' AFTER 'discussion_reply';

-- Update the default notification_preferences on users table to include discussion_mentions
ALTER TABLE users
  ALTER COLUMN notification_preferences
  SET DEFAULT '{"comments": true, "votes": true, "collaborators": true, "status_changes": true, "task_mentions": true, "comment_mentions": true, "email_notifications": true, "collaboration_requests": true, "collaboration_responses": true, "discussion_mentions": true}'::jsonb;

-- Update the trigger function that sets default preferences for new users
CREATE OR REPLACE FUNCTION set_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.notification_preferences IS NULL THEN
    NEW.notification_preferences := '{"comments": true, "votes": true, "collaborators": true, "status_changes": true, "task_mentions": true, "comment_mentions": true, "email_notifications": true, "collaboration_requests": true, "collaboration_responses": true, "discussion_mentions": true}'::jsonb;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing users: add discussion_mentions = true if missing
UPDATE users
SET notification_preferences = notification_preferences || '{"discussion_mentions": true}'::jsonb
WHERE NOT (notification_preferences ? 'discussion_mentions');
