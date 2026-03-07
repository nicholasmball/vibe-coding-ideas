-- Add priority column to board_tasks
-- Four levels: low, medium, high, urgent (default: medium)
-- Using text + CHECK constraint (not enum) for easier future extensibility

ALTER TABLE board_tasks
ADD COLUMN priority text NOT NULL DEFAULT 'medium'
CONSTRAINT board_tasks_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
