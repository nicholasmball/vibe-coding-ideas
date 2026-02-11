-- Add denormalized comment_count to board_tasks (like attachment_count)
ALTER TABLE board_tasks ADD COLUMN comment_count integer NOT NULL DEFAULT 0;

-- Backfill existing counts
UPDATE board_tasks SET comment_count = (
  SELECT count(*) FROM board_task_comments
  WHERE board_task_comments.task_id = board_tasks.id
);

-- Trigger function to maintain the count
CREATE OR REPLACE FUNCTION update_comment_count() RETURNS trigger AS $$
BEGIN
  UPDATE board_tasks SET comment_count = (
    SELECT count(*) FROM board_task_comments
    WHERE task_id = COALESCE(NEW.task_id, OLD.task_id)
  ) WHERE id = COALESCE(NEW.task_id, OLD.task_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER comment_count_trigger
  AFTER INSERT OR DELETE ON board_task_comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_count();
