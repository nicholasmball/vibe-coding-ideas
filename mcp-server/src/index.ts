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

// Session-level mutable identity
// Can be overridden via VIBECODES_BOT_ID env var or set_bot_identity tool
let activeBotId: string | null = process.env.VIBECODES_BOT_ID || null;

export function setActiveBotId(botId: string | null) {
  activeBotId = botId;
}

export function getActiveBotId(): string | null {
  return activeBotId;
}

const getContext = (): McpContext => ({
  supabase,
  userId: activeBotId || BOT_USER_ID,
});

registerTools(server, getContext, setActiveBotId);

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
