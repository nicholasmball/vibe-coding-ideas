import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { createClient } from "@supabase/supabase-js";
import { registerTools } from "../../../../../mcp-server/src/register-tools";
import type { McpContext } from "../../../../../mcp-server/src/context";
import type { Database } from "@/types/database";

const handler = createMcpHandler(
  (server) => {
    // Per-connection mutable bot identity (set by set_bot_identity tool)
    let activeBotId: string | null = null;

    registerTools(
      server,
      (extra) => {
        const authInfo = extra.authInfo;
        if (!authInfo) {
          throw new Error("Authentication required");
        }

        const realUserId = authInfo.extra?.userId as string;
        const token = authInfo.token;

        // Per-request Supabase client with user's JWT — RLS enforced
        const supabase = createClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: { Authorization: `Bearer ${token}` },
            },
          }
        );

        return {
          supabase,
          userId: activeBotId || realUserId,
          ownerUserId: realUserId,
        } satisfies McpContext;
      },
      (botId) => {
        activeBotId = botId;
      }
    );
  },
  {
    serverInfo: { name: "vibecodes-remote", version: "1.0.0" },
  },
  {
    streamableHttpEndpoint: "/api/mcp",
  }
);

const verifyToken = async (_req: Request, bearerToken?: string) => {
  if (!bearerToken) return undefined;

  // Use service-role client to validate the token
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(bearerToken);

  if (error || !user) return undefined;

  return {
    token: bearerToken,
    clientId: "vibecodes",
    scopes: ["mcp:tools"],
    extra: { userId: user.id },
  };
};

const authHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource",
});

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
