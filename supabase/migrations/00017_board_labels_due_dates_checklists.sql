-- ============================================================
-- board_labels: per-idea colored labels
-- ============================================================
CREATE TABLE board_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'blue',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE board_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view board labels"
  ON board_labels FOR SELECT
  USING (is_idea_team_member(idea_id, auth.uid()));

CREATE POLICY "Team members can insert board labels"
  ON board_labels FOR INSERT
  WITH CHECK (is_idea_team_member(idea_id, auth.uid()));

CREATE POLICY "Team members can update board labels"
  ON board_labels FOR UPDATE
  USING (is_idea_team_member(idea_id, auth.uid()));

CREATE POLICY "Team members can delete board labels"
  ON board_labels FOR DELETE
  USING (is_idea_team_member(idea_id, auth.uid()));

-- ============================================================
-- board_task_labels: many-to-many junction
-- ============================================================
CREATE TABLE board_task_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES board_tasks(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES board_labels(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id, label_id)
);

ALTER TABLE board_task_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view board task labels"
  ON board_task_labels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_tasks bt
      WHERE bt.id = board_task_labels.task_id
        AND is_idea_team_member(bt.idea_id, auth.uid())
    )
  );

CREATE POLICY "Team members can insert board task labels"
  ON board_task_labels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_tasks bt
      WHERE bt.id = board_task_labels.task_id
        AND is_idea_team_member(bt.idea_id, auth.uid())
    )
  );

CREATE POLICY "Team members can delete board task labels"
  ON board_task_labels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM board_tasks bt
      WHERE bt.id = board_task_labels.task_id
        AND is_idea_team_member(bt.idea_id, auth.uid())
    )
  );

-- ============================================================
-- board_checklist_items: subtasks within a task
-- ============================================================
CREATE TABLE board_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES board_tasks(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE board_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view checklist items"
  ON board_checklist_items FOR SELECT
  USING (is_idea_team_member(idea_id, auth.uid()));

CREATE POLICY "Team members can insert checklist items"
  ON board_checklist_items FOR INSERT
  WITH CHECK (is_idea_team_member(idea_id, auth.uid()));

CREATE POLICY "Team members can update checklist items"
  ON board_checklist_items FOR UPDATE
  USING (is_idea_team_member(idea_id, auth.uid()));

CREATE POLICY "Team members can delete checklist items"
  ON board_checklist_items FOR DELETE
  USING (is_idea_team_member(idea_id, auth.uid()));

-- ============================================================
-- Alter board_tasks: add due_date, checklist_total, checklist_done
-- ============================================================
ALTER TABLE board_tasks
  ADD COLUMN due_date timestamptz,
  ADD COLUMN checklist_total integer NOT NULL DEFAULT 0,
  ADD COLUMN checklist_done integer NOT NULL DEFAULT 0;

-- ============================================================
-- Trigger: auto-maintain checklist counts on board_tasks
-- ============================================================
CREATE OR REPLACE FUNCTION update_checklist_counts()
RETURNS trigger AS $$
DECLARE
  target_task_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_task_id := OLD.task_id;
  ELSE
    target_task_id := NEW.task_id;
  END IF;

  UPDATE board_tasks SET
    checklist_total = (SELECT count(*) FROM board_checklist_items WHERE task_id = target_task_id),
    checklist_done = (SELECT count(*) FROM board_checklist_items WHERE task_id = target_task_id AND completed = true)
  WHERE id = target_task_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER checklist_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON board_checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_checklist_counts();

-- ============================================================
-- Realtime: add new tables to publication
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE board_labels;
ALTER PUBLICATION supabase_realtime ADD TABLE board_task_labels;
ALTER PUBLICATION supabase_realtime ADD TABLE board_checklist_items;
