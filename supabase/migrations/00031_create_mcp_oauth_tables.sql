-- MCP OAuth tables for remote Claude Code authentication
-- These tables are accessed via service-role only (no RLS needed)

-- Dynamic Client Registration (RFC 7591)
CREATE TABLE IF NOT EXISTS mcp_oauth_clients (
  client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_secret TEXT NOT NULL,
  redirect_uris TEXT[] NOT NULL DEFAULT '{}',
  client_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Short-lived authorization codes (10-min TTL, single-use)
CREATE TABLE IF NOT EXISTS mcp_oauth_codes (
  code TEXT PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES mcp_oauth_clients(client_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  code_challenge TEXT NOT NULL,
  code_challenge_method TEXT NOT NULL DEFAULT 'S256',
  supabase_access_token TEXT NOT NULL,
  supabase_refresh_token TEXT NOT NULL,
  scope TEXT DEFAULT '',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for cleanup of expired codes
CREATE INDEX IF NOT EXISTS idx_mcp_oauth_codes_expires_at ON mcp_oauth_codes(expires_at);
