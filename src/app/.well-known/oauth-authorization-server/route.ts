import { NextResponse } from "next/server";
import { metadataCorsOptionsRequestHandler } from "mcp-handler";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function GET(request: Request) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    return NextResponse.json(
      {
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/api/oauth/authorize`,
        token_endpoint: `${baseUrl}/api/oauth/token`,
        registration_endpoint: `${baseUrl}/api/oauth/register`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        token_endpoint_auth_methods_supported: ["client_secret_post"],
        code_challenge_methods_supported: ["S256"],
        scopes_supported: ["mcp:tools"],
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "internal_error", message: String(error) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

const corsHandler = metadataCorsOptionsRequestHandler();

export { corsHandler as OPTIONS };
