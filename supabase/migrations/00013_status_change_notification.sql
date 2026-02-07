-- Add 'status_change' to the notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'status_change';
