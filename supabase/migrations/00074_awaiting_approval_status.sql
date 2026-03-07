-- Add awaiting_approval status to workflow steps
-- When a step has human_check_required=true, complete_step moves it to
-- awaiting_approval instead of completed. Humans then approve or reject.

-- 1. Drop old CHECK constraint and add new one with awaiting_approval
ALTER TABLE task_workflow_steps
  DROP CONSTRAINT IF EXISTS task_workflow_steps_status_check;

ALTER TABLE task_workflow_steps
  ADD CONSTRAINT task_workflow_steps_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'awaiting_approval'));
