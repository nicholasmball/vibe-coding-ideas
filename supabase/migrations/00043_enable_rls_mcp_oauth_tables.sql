-- Enable RLS on MCP OAuth tables
-- These tables are only accessed server-side via service role key (which bypasses RLS).
-- Enabling RLS with no public policies locks down direct PostgREST/client access.

ALTER TABLE public.mcp_oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mcp_oauth_codes ENABLE ROW LEVEL SECURITY;
