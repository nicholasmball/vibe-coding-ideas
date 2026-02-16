-- Add active_bot_id to users for persisting bot identity across MCP sessions
ALTER TABLE users ADD COLUMN active_bot_id UUID REFERENCES bot_profiles(id) ON DELETE SET NULL;
