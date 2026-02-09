ALTER TABLE board_tasks ADD COLUMN archived boolean NOT NULL DEFAULT false;
CREATE INDEX idx_board_tasks_archived ON board_tasks(idea_id, archived);
