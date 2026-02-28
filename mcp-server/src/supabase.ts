import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
  );
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey
);

export const BOT_USER_ID =
  process.env.VIBECODES_BOT_USER_ID || "a0000000-0000-4000-a000-000000000001";

// Human owner ID for local MCP — set this to the admin user so tools like
// list_agents and get_agent_mentions can discover agents created via the web UI.
export const OWNER_USER_ID = process.env.VIBECODES_OWNER_ID || undefined;

// Re-export constants for backward compatibility
export { POSITION_GAP, DEFAULT_BOARD_COLUMNS, VALID_LABEL_COLORS } from "./constants";
