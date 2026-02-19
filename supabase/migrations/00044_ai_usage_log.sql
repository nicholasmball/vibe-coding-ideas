-- AI Usage Log table for tracking AI feature usage and costs
CREATE TABLE IF NOT EXISTS ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('enhance_description', 'generate_questions', 'enhance_with_context', 'generate_board_tasks')),
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  model text NOT NULL,
  key_type text NOT NULL CHECK (key_type IN ('platform', 'byok')),
  idea_id uuid REFERENCES ideas(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_ai_usage_log_user_id ON ai_usage_log(user_id);
CREATE INDEX idx_ai_usage_log_created_at ON ai_usage_log(created_at);
CREATE INDEX idx_ai_usage_log_user_created ON ai_usage_log(user_id, created_at);

-- Per-user daily AI call limit (null = unlimited)
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_daily_limit integer NOT NULL DEFAULT 10;

-- RLS
ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "ai_usage_log_select_own"
  ON ai_usage_log FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all usage
CREATE POLICY "ai_usage_log_select_admin"
  ON ai_usage_log FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));

-- Users can insert their own usage rows
CREATE POLICY "ai_usage_log_insert_own"
  ON ai_usage_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);
