CREATE TABLE board_task_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES board_tasks(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_board_task_activity_task ON board_task_activity(task_id, created_at DESC);

ALTER TABLE board_task_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view" ON board_task_activity FOR SELECT
  USING (is_idea_team_member(idea_id, auth.uid()));
CREATE POLICY "Team members can insert" ON board_task_activity FOR INSERT
  WITH CHECK (is_idea_team_member(idea_id, auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE board_task_activity;
ALTER TABLE board_task_activity REPLICA IDENTITY FULL;
