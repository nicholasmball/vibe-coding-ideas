import { NextResponse } from "next/server";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    return NextResponse.json(
      { error: "server_error", error_description: "NEXT_PUBLIC_APP_URL is not configured" },
      { status: 500 }
    );
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  return NextResponse.json({
    resource: `${baseUrl}/api/mcp`,
    authorization_servers: [baseUrl],
    scopes_supported: ["mcp:tools"],
    bearer_methods_supported: ["header"],
  });
}
