import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { supabase, BOT_USER_ID } from "./supabase";
import { registerTools } from "./register-tools";
import type { McpContext } from "./context";

const server = new McpServer(
  { name: "vibecodes", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Local stdio mode: static context with service-role client + bot user
const localContext: McpContext = { supabase, userId: BOT_USER_ID };
registerTools(server, () => localContext);

// --- Start server ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("VibeCodes MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
