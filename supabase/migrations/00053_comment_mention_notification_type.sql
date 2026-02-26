-- Add comment_mention to the notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'comment_mention';
