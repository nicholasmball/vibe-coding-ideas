-- Workflow Step Comments: unified thread for inter-agent communication, outputs, and failures
-- Replaces output/failure_reason columns on task_workflow_steps

-- 1. Create step comments table with type discriminator
CREATE TABLE workflow_step_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid NOT NULL REFERENCES task_workflow_steps(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'comment'
    CHECK (type IN ('comment', 'output', 'failure')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_step_comments_step_id ON workflow_step_comments(step_id);

ALTER TABLE workflow_step_comments ENABLE ROW LEVEL SECURITY;

-- RLS: team members can read
CREATE POLICY "Team members can read step comments"
  ON workflow_step_comments FOR SELECT
  USING (
    is_idea_team_member(idea_id, auth.uid())
    OR (auth.uid() IS NOT NULL AND is_idea_public(idea_id))
  );

-- RLS: team members can insert (must be their own author_id)
CREATE POLICY "Team members can insert step comments"
  ON workflow_step_comments FOR INSERT
  WITH CHECK (is_idea_team_member(idea_id, auth.uid()) AND auth.uid() = author_id);

-- RLS: authors can delete own comments
CREATE POLICY "Authors can delete own step comments"
  ON workflow_step_comments FOR DELETE
  USING (auth.uid() = author_id);

-- 2. Denormalized comment count on steps
ALTER TABLE task_workflow_steps ADD COLUMN comment_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION update_step_comment_count()
RETURNS trigger AS $$
DECLARE
  target_step_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_step_id := OLD.step_id;
  ELSE
    target_step_id := NEW.step_id;
  END IF;

  UPDATE task_workflow_steps SET
    comment_count = (SELECT count(*) FROM workflow_step_comments WHERE step_id = target_step_id)
  WHERE id = target_step_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER step_comment_count_trigger
  AFTER INSERT OR DELETE ON workflow_step_comments
  FOR EACH ROW EXECUTE FUNCTION update_step_comment_count();

-- 3. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_step_comment_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER step_comment_updated_at_trigger
  BEFORE UPDATE ON workflow_step_comments
  FOR EACH ROW EXECUTE FUNCTION update_step_comment_updated_at();

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_step_comments;
ALTER TABLE workflow_step_comments REPLICA IDENTITY FULL;

-- 5. Drop output and failure_reason from task_workflow_steps (now in comments thread)
ALTER TABLE task_workflow_steps DROP COLUMN output;
ALTER TABLE task_workflow_steps DROP COLUMN failure_reason;
