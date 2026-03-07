-- Workflow Orchestration: task workflow steps, step comments, orchestrator agents
-- Consolidated from migrations 00068–00078

-- ============================================================
-- Part 1: Task Workflow Steps table (sequential agent pipeline)
-- ============================================================

CREATE TABLE task_workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES board_tasks(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  bot_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'awaiting_approval')),
  position integer NOT NULL DEFAULT 0,
  human_check_required boolean NOT NULL DEFAULT false,
  comment_count integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_workflow_steps ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view workflow steps for public ideas or team members"
  ON task_workflow_steps FOR SELECT
  USING (
    is_idea_team_member(idea_id, auth.uid())
    OR (auth.uid() IS NOT NULL AND is_idea_public(idea_id))
  );

CREATE POLICY "Team members can insert workflow steps"
  ON task_workflow_steps FOR INSERT
  WITH CHECK (is_idea_team_member(idea_id, auth.uid()));

CREATE POLICY "Team members can update workflow steps"
  ON task_workflow_steps FOR UPDATE
  USING (is_idea_team_member(idea_id, auth.uid()));

CREATE POLICY "Team members can delete workflow steps"
  ON task_workflow_steps FOR DELETE
  USING (is_idea_team_member(idea_id, auth.uid()));

-- Indexes for common query patterns
CREATE INDEX idx_workflow_steps_task_id ON task_workflow_steps(task_id);
CREATE INDEX idx_workflow_steps_idea_id ON task_workflow_steps(idea_id);

-- Replace denormalized checklist columns on board_tasks
ALTER TABLE board_tasks
  DROP COLUMN checklist_total,
  DROP COLUMN checklist_done,
  ADD COLUMN workflow_step_total integer NOT NULL DEFAULT 0,
  ADD COLUMN workflow_step_completed integer NOT NULL DEFAULT 0;

-- Trigger: maintain workflow step counts on board_tasks
CREATE OR REPLACE FUNCTION update_workflow_step_counts()
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
    workflow_step_total = (SELECT count(*) FROM task_workflow_steps WHERE task_id = target_task_id),
    workflow_step_completed = (SELECT count(*) FROM task_workflow_steps WHERE task_id = target_task_id AND status = 'completed')
  WHERE id = target_task_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER workflow_step_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON task_workflow_steps
  FOR EACH ROW EXECUTE FUNCTION update_workflow_step_counts();

-- Trigger: auto-update updated_at on workflow steps
CREATE OR REPLACE FUNCTION update_workflow_step_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workflow_step_updated_at_trigger
  BEFORE UPDATE ON task_workflow_steps
  FOR EACH ROW EXECUTE FUNCTION update_workflow_step_updated_at();

-- Drop old checklist infrastructure
DROP TRIGGER IF EXISTS checklist_counts_trigger ON board_checklist_items;
DROP FUNCTION IF EXISTS update_checklist_counts();
ALTER PUBLICATION supabase_realtime DROP TABLE board_checklist_items;
DROP TABLE board_checklist_items;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE task_workflow_steps;
ALTER TABLE task_workflow_steps REPLICA IDENTITY FULL;

-- ============================================================
-- Part 2: Workflow Step Comments (inter-agent communication)
-- ============================================================

CREATE TABLE workflow_step_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid NOT NULL REFERENCES task_workflow_steps(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'comment'
    CHECK (type IN ('comment', 'output', 'failure', 'approval', 'changes_requested')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_step_comments_step_id ON workflow_step_comments(step_id);

ALTER TABLE workflow_step_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can read step comments"
  ON workflow_step_comments FOR SELECT
  USING (
    is_idea_team_member(idea_id, auth.uid())
    OR (auth.uid() IS NOT NULL AND is_idea_public(idea_id))
  );

CREATE POLICY "Team members can insert step comments"
  ON workflow_step_comments FOR INSERT
  WITH CHECK (is_idea_team_member(idea_id, auth.uid()) AND auth.uid() = author_id);

CREATE POLICY "Authors can delete own step comments"
  ON workflow_step_comments FOR DELETE
  USING (auth.uid() = author_id);

-- Trigger: denormalized comment count on steps
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER step_comment_count_trigger
  AFTER INSERT OR DELETE ON workflow_step_comments
  FOR EACH ROW EXECUTE FUNCTION update_step_comment_count();

-- Trigger: auto-update updated_at on step comments
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

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_step_comments;
ALTER TABLE workflow_step_comments REPLICA IDENTITY FULL;

-- ============================================================
-- Part 3: Orchestration Agent flag on idea_agents
-- ============================================================

ALTER TABLE idea_agents ADD COLUMN is_orchestrator boolean NOT NULL DEFAULT false;

-- Trigger: enforce at most one orchestrator per idea (last-write-wins)
CREATE OR REPLACE FUNCTION enforce_single_orchestrator()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_orchestrator = true THEN
    UPDATE idea_agents
    SET is_orchestrator = false
    WHERE idea_id = NEW.idea_id
      AND id != NEW.id
      AND is_orchestrator = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_single_orchestrator
  BEFORE INSERT OR UPDATE OF is_orchestrator ON idea_agents
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_orchestrator();

-- UPDATE policy for idea_agents (only SELECT/INSERT/DELETE exist)
CREATE POLICY "Team members can update idea agents"
  ON idea_agents FOR UPDATE
  USING (is_idea_team_member(idea_id, auth.uid()))
  WITH CHECK (is_idea_team_member(idea_id, auth.uid()));

-- ============================================================
-- Part 4: Discussion autonomy level
-- ============================================================

ALTER TABLE idea_discussions
  ADD COLUMN autonomy_level integer NOT NULL DEFAULT 2
    CHECK (autonomy_level BETWEEN 1 AND 4);

-- ============================================================
-- Part 5: Bot profile extensions (deliverables, templates, type)
-- ============================================================

ALTER TABLE bot_profiles
  ADD COLUMN deliverables text[] NOT NULL DEFAULT '{}',
  ADD COLUMN workflow_templates jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN agent_type text NOT NULL DEFAULT 'worker'
    CHECK (agent_type IN ('worker', 'orchestrator'));

-- ============================================================
-- Part 6: Seed default orchestration agent
-- ============================================================

-- UUID: b0000000-0000-4000-a000-000000000016
-- Owner: a0000000-0000-4000-a000-000000000001 (VIBECODES_USER_ID)

-- 6a. Insert auth.users row (handle_new_user trigger creates public.users)
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token
) VALUES (
  'b0000000-0000-4000-a000-000000000016',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'bot-orchestrator@vibecodes.local', '', now(),
  jsonb_build_object('full_name', 'VibeCodes Orchestration Agent', 'avatar_url', ''),
  now(), now(), '', ''
)
ON CONFLICT (id) DO NOTHING;

-- 6b. Set is_bot = true (bypass prevent_privilege_escalation)
SELECT set_config('app.trusted_bot_operation', 'true', true);

UPDATE public.users SET is_bot = true
WHERE id = 'b0000000-0000-4000-a000-000000000016';

SELECT set_config('app.trusted_bot_operation', '', true);

-- 6c. Insert bot_profiles with final orchestrator prompt and workflow templates
INSERT INTO bot_profiles (
  id, owner_id, name, role, system_prompt, avatar_url, is_active,
  bio, skills, is_published, agent_type, workflow_templates
) VALUES (
  'b0000000-0000-4000-a000-000000000016',
  'a0000000-0000-4000-a000-000000000001',
  'VibeCodes Orchestration Agent',
  'Orchestration Agent',
  E'## Goal\nCoordinate multi-agent workflows on VibeCodes. Convert discussions into board tasks with sequential workflow steps, assigning each step to the right worker agent. Carry forward full context from discussions so agents can work independently.\n\n## Constraints\n- Always link tasks back to the source discussion.\n- Only assign steps to agents whose skills match the work.\n- Carry forward key decisions, requirements, and constraints from the discussion into the task description.\n- Do not create duplicate tasks for the same discussion.\n- Never start a step with unresolved dependencies on earlier steps.\n- **Never delete completed or failed steps** — use `fail_step` instead, which cascade-resets all subsequent steps to pending.\n\n## Workflow Templates\nYou have built-in workflow templates (Dev, Content Creation, Business Ops) that define standard step sequences with agent roles. When creating workflow steps:\n1. Identify which template best fits the discussion topic.\n2. Use the template as a starting framework — adapt, add, remove, or reorder steps based on the specific requirements.\n3. Match `agent_role` from the template to actual agents in the idea''s worker pool using `list_idea_agents`.\n4. If no template fits, design a custom pipeline from scratch.\n\nTemplates are suggestions, not rigid rules. Always tailor the pipeline to the discussion''s actual needs.\n\n## Workflow Steps\nEach board task has an ordered pipeline of steps in `task_workflow_steps`. Every step is assigned to a worker agent (`bot_id`) and follows: `pending` → `in_progress` → `completed` | `failed` | `awaiting_approval`.\n\n### Human Check Required\nSteps flagged with `human_check_required: true` move to `awaiting_approval` instead of `completed` when the agent calls `complete_step`. A team member must then approve (via `approve_step`) or reject (via `fail_step`) before the pipeline continues.\n\n### Cascade Reset on Failure\nWhen a step is failed via `fail_step`, all subsequent steps automatically reset to `pending`. The failed step keeps its failure comment for context when retried.\n\n## MCP Tools\n\n### Pipeline Management\n- `create_workflow_steps` — create ordered steps (title, description, bot_id, optional human_check_required). Use `after_step_id` to insert mid-pipeline.\n- `update_workflow_step` / `delete_workflow_step` — modify or remove steps (prefer fail_step over delete for rework).\n- `get_step_context` — retrieve all steps with their comments and outputs for a task.\n\n### Step Execution\n- `claim_next_step` — find and start the next pending/failed step. Returns prior step outputs as context and the step''s comments thread. Updates the task assignee.\n- `complete_step` — mark a step done with structured markdown output. If human_check_required, moves to awaiting_approval.\n- `approve_step` — approve a step that is awaiting human approval (completes it).\n- `fail_step` — mark a step as failed with a reason. Cascade-resets all subsequent steps.\n\n### Communication\n- `add_step_comment` — post a comment on a step''s thread (ask questions, provide feedback, communicate with other agents).\n- `get_step_comments` — read all comments on a step.\n\n## Autonomy Level\nEach discussion has an `autonomy_level` (1-4) controlling human checkpoints. The `convert_discussion` response includes `autonomy_level` and `autonomy_instruction` — always follow these:\n\n- **Level 1 (Full Oversight):** `human_check_required: true` on every step.\n- **Level 2 (Key Checkpoints):** `human_check_required: true` on key deliverable steps. Place checks after automated quality gates (code review, QA) so humans review validated work. This is the default.\n- **Level 3 (Review on Completion):** `human_check_required: true` on only the final step.\n- **Level 4 (Fully Autonomous):** No human checks.\n\n### Mandatory Checkpoints (Levels 1-3)\nAlways set `human_check_required: true` on UI-related steps regardless of autonomy level:\n- UX design or mockup deliverables\n- Frontend implementation producing visual changes\n\nUI work requires subjective human review that agents cannot fully validate.\n\n## Conversion Workflow\n1. Read the full discussion thread (body + all replies) to understand context.\n2. Extract requirements and acceptance criteria.\n3. Call `convert_discussion` to create the task and mark the discussion as converted.\n4. Call `list_idea_agents` to see available worker agents.\n5. Select the best-matching workflow template and adapt it to the requirements.\n6. Call `create_workflow_steps` to build the pipeline, assigning each step to the best-matched worker agent.\n   - Follow the workflow template step ordering (e.g. TDD: tests before implementation).\n   - Respect the autonomy_level for human checkpoints.\n7. Reply to the discussion confirming the task and steps were created.\n8. Use `claim_next_step` to drive the pipeline forward.',
  NULL,
  true,
  'Coordinates multi-agent workflows by converting discussions into tasks and assigning work to the right agents',
  ARRAY['orchestration', 'planning', 'coordination', 'delegation'],
  true,
  'orchestrator',
  '[
    {
      "name": "Dev",
      "steps": [
        {"title": "Requirements & Scoping", "agent_role": "Product Manager", "description": "Define acceptance criteria, scope, and technical requirements from the discussion context"},
        {"title": "UX Design", "agent_role": "UX Designer", "description": "Create wireframes or mockups for any UI changes", "human_check_required": true},
        {"title": "Test Plan & Test Cases", "agent_role": "QA Engineer", "description": "Write test plan and test cases based on requirements and designs BEFORE implementation. Define expected behavior, edge cases, and acceptance test criteria"},
        {"title": "Implementation", "agent_role": "Developer", "description": "Build the feature or fix according to the requirements, approved designs, and pre-written test cases. Ensure all tests pass"},
        {"title": "Code Review", "agent_role": "Code Reviewer", "description": "Review implementation for quality, security, test coverage, and adherence to requirements"},
        {"title": "QA Verification", "agent_role": "QA Engineer", "description": "Run the pre-written tests against the implementation, verify acceptance criteria are met, and report any failures", "human_check_required": true},
        {"title": "Documentation", "agent_role": "Technical Writer", "description": "Update relevant documentation, README, or changelog"}
      ]
    },
    {
      "name": "Content Creation",
      "steps": [
        {"title": "Research & Brief", "agent_role": "Content Strategist", "description": "Research the topic, define target audience, key messages, and content brief"},
        {"title": "Outline & Structure", "agent_role": "Content Strategist", "description": "Create a detailed outline with sections, key points, and supporting evidence"},
        {"title": "Draft", "agent_role": "Copywriter", "description": "Write the first draft following the approved outline and brief"},
        {"title": "Editorial Review", "agent_role": "Editor", "description": "Review for clarity, tone, grammar, and adherence to brand voice", "human_check_required": true},
        {"title": "Visual Assets", "agent_role": "Graphic Designer", "description": "Create supporting graphics, images, or diagrams", "human_check_required": true},
        {"title": "Final Review & Publish", "agent_role": "Content Strategist", "description": "Final proofread, SEO check, and prepare for publication", "human_check_required": true}
      ]
    },
    {
      "name": "Business Ops",
      "steps": [
        {"title": "Analysis & Discovery", "agent_role": "Business Analyst", "description": "Analyse the current state, gather data, and identify the problem or opportunity"},
        {"title": "Solution Design", "agent_role": "Business Analyst", "description": "Propose solutions with cost-benefit analysis, risks, and implementation plan", "human_check_required": true},
        {"title": "Process Documentation", "agent_role": "Technical Writer", "description": "Document the new process, SOPs, or policy changes"},
        {"title": "Stakeholder Review", "agent_role": "Project Manager", "description": "Prepare stakeholder summary and gather approvals", "human_check_required": true},
        {"title": "Implementation", "agent_role": "Project Manager", "description": "Execute the plan, coordinate across teams, and track milestones"},
        {"title": "Metrics & Reporting", "agent_role": "Business Analyst", "description": "Define KPIs, set up tracking, and deliver initial performance report", "human_check_required": true}
      ]
    }
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
