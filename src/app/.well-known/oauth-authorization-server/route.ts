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
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
    token_endpoint: `${baseUrl}/api/oauth/token`,
    registration_endpoint: `${baseUrl}/api/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["client_secret_post"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: ["mcp:tools"],
  });
}
