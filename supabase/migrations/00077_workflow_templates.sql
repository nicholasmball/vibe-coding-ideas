-- Add workflow_templates to bot_profiles for orchestration agents
-- Templates define reusable step sequences referencing agent roles
-- Example: [{"name": "Dev Workflow", "steps": [{"agent_role": "UX Designer"}, {"agent_role": "Developer"}]}]
ALTER TABLE bot_profiles
  ADD COLUMN IF NOT EXISTS workflow_templates jsonb NOT NULL DEFAULT '[]';
