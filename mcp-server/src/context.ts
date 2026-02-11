import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

export interface McpContext {
  supabase: SupabaseClient<Database>;
  userId: string;
}
