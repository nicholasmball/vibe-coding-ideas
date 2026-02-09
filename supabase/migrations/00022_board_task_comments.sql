CREATE TABLE board_task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES board_tasks(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_board_task_comments_task ON board_task_comments(task_id, created_at);

ALTER TABLE board_task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view" ON board_task_comments FOR SELECT
  USING (is_idea_team_member(idea_id, auth.uid()));
CREATE POLICY "Team members can insert" ON board_task_comments FOR INSERT
  WITH CHECK (is_idea_team_member(idea_id, auth.uid()));
CREATE POLICY "Authors can delete own" ON board_task_comments FOR DELETE
  USING (author_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE board_task_comments;
ALTER TABLE board_task_comments REPLICA IDENTITY FULL;
