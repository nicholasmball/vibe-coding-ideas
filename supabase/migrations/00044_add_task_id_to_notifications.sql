-- Add task_id column to notifications for linking task_mention notifications to specific tasks
ALTER TABLE notifications ADD COLUMN task_id UUID REFERENCES board_tasks(id) ON DELETE SET NULL;
