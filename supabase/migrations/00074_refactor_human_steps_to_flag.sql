-- Refactor: replace step_type enum with human_check_required boolean flag
-- All steps are now agent steps. Human validation is a flag on the step, not a separate type.
-- Combines get_next_step + start_step into claim_next_step (MCP change, no DB impact).

-- 1. Add human_check_required column
ALTER TABLE task_workflow_steps
  ADD COLUMN human_check_required boolean NOT NULL DEFAULT false;

-- 2. Migrate any existing human steps: mark the preceding agent step as human_check_required,
--    then delete the standalone human steps. If no preceding agent step exists, just delete.
DO $$
DECLARE
  hs RECORD;
  prev_id uuid;
BEGIN
  FOR hs IN
    SELECT id, task_id, position
    FROM task_workflow_steps
    WHERE step_type = 'human'
    ORDER BY task_id, position
  LOOP
    -- Find the closest preceding agent step in the same task
    SELECT id INTO prev_id
    FROM task_workflow_steps
    WHERE task_id = hs.task_id
      AND position < hs.position
      AND step_type = 'agent'
    ORDER BY position DESC
    LIMIT 1;

    IF prev_id IS NOT NULL THEN
      UPDATE task_workflow_steps
      SET human_check_required = true
      WHERE id = prev_id;
    END IF;

    DELETE FROM task_workflow_steps WHERE id = hs.id;
  END LOOP;
END $$;

-- 3. Drop the constraint that enforced bot_id based on step_type
ALTER TABLE task_workflow_steps
  DROP CONSTRAINT IF EXISTS workflow_step_type_bot_check;

-- 4. Make bot_id NOT NULL (all remaining steps are agent steps with a bot_id)
ALTER TABLE task_workflow_steps
  ALTER COLUMN bot_id SET NOT NULL;

-- 5. Drop step_type column
ALTER TABLE task_workflow_steps
  DROP COLUMN IF EXISTS step_type;

-- 6. Drop the enum type
DROP TYPE IF EXISTS workflow_step_type;
