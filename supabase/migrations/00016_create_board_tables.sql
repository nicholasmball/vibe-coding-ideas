-- Board columns table
CREATE TABLE board_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Board tasks table
CREATE TABLE board_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  column_id uuid NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assignee_id uuid REFERENCES users(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for board_columns
CREATE INDEX idx_board_columns_idea_id ON board_columns(idea_id);
CREATE INDEX idx_board_columns_idea_position ON board_columns(idea_id, position);

-- Indexes for board_tasks
CREATE INDEX idx_board_tasks_column_id ON board_tasks(column_id);
CREATE INDEX idx_board_tasks_idea_id ON board_tasks(idea_id);
CREATE INDEX idx_board_tasks_assignee_id ON board_tasks(assignee_id);
CREATE INDEX idx_board_tasks_column_position ON board_tasks(column_id, position);

-- Enable RLS
ALTER TABLE board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_tasks ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is idea author or collaborator
CREATE OR REPLACE FUNCTION is_idea_team_member(p_idea_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM ideas WHERE id = p_idea_id AND author_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM collaborators WHERE idea_id = p_idea_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for board_columns
CREATE POLICY "Team members can view board columns"
  ON board_columns FOR SELECT
  USING (is_idea_team_member(idea_id, auth.uid()));

CREATE POLICY "Team members can insert board columns"
  ON board_columns FOR INSERT
  WITH CHECK (is_idea_team_member(idea_id, auth.uid()));

CREATE POLICY "Team members can update board columns"
  ON board_columns FOR UPDATE
  USING (is_idea_team_member(idea_id, auth.uid()));

CREATE POLICY "Team members can delete board columns"
  ON board_columns FOR DELETE
  USING (is_idea_team_member(idea_id, auth.uid()));

-- RLS policies for board_tasks
CREATE POLICY "Team members can view board tasks"
  ON board_tasks FOR SELECT
  USING (is_idea_team_member(idea_id, auth.uid()));

CREATE POLICY "Team members can insert board tasks"
  ON board_tasks FOR INSERT
  WITH CHECK (is_idea_team_member(idea_id, auth.uid()));

CREATE POLICY "Team members can update board tasks"
  ON board_tasks FOR UPDATE
  USING (is_idea_team_member(idea_id, auth.uid()));

CREATE POLICY "Team members can delete board tasks"
  ON board_tasks FOR DELETE
  USING (is_idea_team_member(idea_id, auth.uid()));

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE board_columns;
ALTER PUBLICATION supabase_realtime ADD TABLE board_tasks;
