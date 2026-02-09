CREATE TABLE board_task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES board_tasks(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  content_type text NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_board_task_attachments_task ON board_task_attachments(task_id);

ALTER TABLE board_task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view" ON board_task_attachments FOR SELECT
  USING (is_idea_team_member(idea_id, auth.uid()));
CREATE POLICY "Team members can insert" ON board_task_attachments FOR INSERT
  WITH CHECK (is_idea_team_member(idea_id, auth.uid()));
CREATE POLICY "Uploader can delete" ON board_task_attachments FOR DELETE
  USING (uploaded_by = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE board_task_attachments;
ALTER TABLE board_task_attachments REPLICA IDENTITY FULL;

-- Denormalized count on board_tasks
ALTER TABLE board_tasks ADD COLUMN attachment_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION update_attachment_count() RETURNS trigger AS $$
BEGIN
  UPDATE board_tasks SET attachment_count = (
    SELECT count(*) FROM board_task_attachments
    WHERE task_id = COALESCE(NEW.task_id, OLD.task_id)
  ) WHERE id = COALESCE(NEW.task_id, OLD.task_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER attachment_count_trigger
  AFTER INSERT OR DELETE ON board_task_attachments
  FOR EACH ROW EXECUTE FUNCTION update_attachment_count();
