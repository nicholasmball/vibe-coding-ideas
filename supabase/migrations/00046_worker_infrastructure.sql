-- Workers table: tracks ALL registered workers (any user can run tasks)
CREATE TABLE workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) <= 100),
  machine_id text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('offline', 'online', 'busy', 'error')),
  platform text NOT NULL CHECK (platform IN ('darwin', 'linux')),
  arch text NOT NULL CHECK (arch IN ('arm64', 'x64')),
  capabilities jsonb DEFAULT '{}'::jsonb,
  ngrok_url text,
  max_containers integer NOT NULL DEFAULT 5 CHECK (max_containers BETWEEN 1 AND 10),
  last_heartbeat timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Task assignments: links tasks to workers
CREATE TABLE task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES board_tasks(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  git_branch text,
  container_id text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'assigned', 'running', 'completed', 'failed', 'cancelled')),
  queue_position integer,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  exit_code integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(task_id)
);

-- Indexes for workers
CREATE INDEX idx_workers_user_id ON workers(user_id);
CREATE INDEX idx_workers_status ON workers(status);
CREATE INDEX idx_workers_machine_id ON workers(machine_id);

-- Indexes for task_assignments
CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_worker_id ON task_assignments(worker_id);
CREATE INDEX idx_task_assignments_idea_id ON task_assignments(idea_id);
CREATE INDEX idx_task_assignments_status ON task_assignments(status);
CREATE INDEX idx_task_assignments_queue ON task_assignments(worker_id, status, queue_position)
  WHERE status = 'queued';

-- Enable RLS
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Workers: users can view ALL workers (to see available workers for assignment)
CREATE POLICY "workers_select_all"
  ON workers FOR SELECT
  TO authenticated
  USING (true);

-- Workers: users can insert their own workers
CREATE POLICY "workers_insert_own"
  ON workers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Workers: users can update their own workers
CREATE POLICY "workers_update_own"
  ON workers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Workers: users can delete their own workers
CREATE POLICY "workers_delete_own"
  ON workers FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Task assignments: team members can view assignments for their ideas
CREATE POLICY "task_assignments_select_team"
  ON task_assignments FOR SELECT
  TO authenticated
  USING (is_idea_team_member(idea_id, auth.uid()));

-- Task assignments: team members can create assignments
CREATE POLICY "task_assignments_insert_team"
  ON task_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    is_idea_team_member(idea_id, auth.uid())
    AND assigned_by = auth.uid()
  );

-- Task assignments: worker owners can update assignments on their workers
CREATE POLICY "task_assignments_update_worker_owner"
  ON task_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workers w
      WHERE w.id = worker_id AND w.user_id = auth.uid()
    )
  );

-- Task assignments: team members can cancel/update assignments they created
CREATE POLICY "task_assignments_update_assigner"
  ON task_assignments FOR UPDATE
  TO authenticated
  USING (assigned_by = auth.uid());

-- Task assignments: team members can delete assignments
CREATE POLICY "task_assignments_delete_team"
  ON task_assignments FOR DELETE
  TO authenticated
  USING (is_idea_team_member(idea_id, auth.uid()));

-- Add git repo info to ideas
ALTER TABLE ideas
  ADD COLUMN IF NOT EXISTS git_repo_url text,
  ADD COLUMN IF NOT EXISTS git_main_branch text DEFAULT 'main';

-- Add current assignment to board_tasks
ALTER TABLE board_tasks
  ADD COLUMN IF NOT EXISTS current_assignment_id uuid REFERENCES task_assignments(id) ON DELETE SET NULL;

-- Index for task assignment lookup
CREATE INDEX IF NOT EXISTS idx_board_tasks_current_assignment ON board_tasks(current_assignment_id);

-- Updated_at trigger for workers
CREATE TRIGGER workers_updated_at
  BEFORE UPDATE ON workers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Updated_at trigger for task_assignments
CREATE TRIGGER task_assignments_updated_at
  BEFORE UPDATE ON task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Helper function: Get available workers with slot counts
CREATE OR REPLACE FUNCTION get_available_workers()
RETURNS TABLE (
  worker_id uuid,
  worker_name text,
  user_id uuid,
  running_tasks bigint,
  max_containers integer,
  slots_available integer
) AS $$
  SELECT
    w.id AS worker_id,
    w.name AS worker_name,
    w.user_id,
    COUNT(ta.id) FILTER (WHERE ta.status = 'running') AS running_tasks,
    w.max_containers,
    w.max_containers - COUNT(ta.id) FILTER (WHERE ta.status = 'running')::integer AS slots_available
  FROM workers w
  LEFT JOIN task_assignments ta ON ta.worker_id = w.id AND ta.status = 'running'
  WHERE w.status = 'online'
  GROUP BY w.id
  HAVING w.max_containers > COUNT(ta.id) FILTER (WHERE ta.status = 'running')
  ORDER BY slots_available DESC;
$$ LANGUAGE SQL STABLE SECURITY INVOKER;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE workers;
ALTER PUBLICATION supabase_realtime ADD TABLE task_assignments;
