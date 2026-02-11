import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vibe-coding-ideas.vercel.app";

  return NextResponse.json({
    resource: `${baseUrl}/api/mcp`,
    authorization_servers: [baseUrl],
    scopes_supported: ["mcp:tools"],
    bearer_methods_supported: ["header"],
  });
}
