-- Add notification preferences to users
-- Default: all notifications enabled
ALTER TABLE users ADD COLUMN notification_preferences jsonb
  NOT NULL DEFAULT '{"comments": true, "votes": true, "collaborators": true, "status_changes": true}'::jsonb;
