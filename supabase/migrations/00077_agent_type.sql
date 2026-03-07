-- Add agent_type to bot_profiles: 'worker' (default) or 'orchestrator'
ALTER TABLE bot_profiles
  ADD COLUMN IF NOT EXISTS agent_type text NOT NULL DEFAULT 'worker'
  CHECK (agent_type IN ('worker', 'orchestrator'));
