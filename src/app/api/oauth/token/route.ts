import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import type { Database } from "@/types/database";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function base64URLEncode(buffer: Buffer): string {
  return buffer.toString("base64url");
}

function sha256(input: string): Buffer {
  return crypto.createHash("sha256").update(input).digest();
}

export async function POST(request: Request) {
  const body = await request.formData();
  const grantType = body.get("grant_type") as string;

  if (grantType === "authorization_code") {
    return handleAuthorizationCode(body);
  }

  if (grantType === "refresh_token") {
    return handleRefreshToken(body);
  }

  return NextResponse.json(
    { error: "unsupported_grant_type", error_description: "Supported: authorization_code, refresh_token" },
    { status: 400 }
  );
}

async function handleAuthorizationCode(body: FormData) {
  const code = body.get("code") as string;
  const codeVerifier = body.get("code_verifier") as string;
  const clientId = body.get("client_id") as string;
  const redirectUri = body.get("redirect_uri") as string;

  if (!code || !codeVerifier || !clientId) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing required parameters" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  // Look up the authorization code
  const { data: authCode, error } = await supabase
    .from("mcp_oauth_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error || !authCode) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Invalid authorization code" },
      { status: 400 }
    );
  }

  // Check not expired
  if (new Date(authCode.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Authorization code expired" },
      { status: 400 }
    );
  }

  // Check not used
  if (authCode.used) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Authorization code already used" },
      { status: 400 }
    );
  }

  // Verify client_id matches
  if (authCode.client_id !== clientId) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "client_id mismatch" },
      { status: 400 }
    );
  }

  // Verify redirect_uri if stored
  if (redirectUri && authCode.redirect_uri !== redirectUri) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "redirect_uri mismatch" },
      { status: 400 }
    );
  }

  // Verify PKCE: SHA256(code_verifier) === code_challenge
  const computedChallenge = base64URLEncode(sha256(codeVerifier));
  if (computedChallenge !== authCode.code_challenge) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "PKCE verification failed" },
      { status: 400 }
    );
  }

  // Mark as used
  await supabase
    .from("mcp_oauth_codes")
    .update({ used: true })
    .eq("code", code);

  // Refresh the session to get fresh tokens with full TTL
  // (the stored tokens may already be partially expired)
  const anonClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: refreshed, error: refreshError } = await anonClient.auth.refreshSession({
    refresh_token: authCode.supabase_refresh_token,
  });

  if (!refreshError && refreshed.session) {
    return NextResponse.json({
      access_token: refreshed.session.access_token,
      token_type: "bearer",
      expires_in: refreshed.session.expires_in,
      refresh_token: refreshed.session.refresh_token,
      scope: authCode.scope || "mcp:tools",
    });
  }

  // Fallback to stored tokens if refresh fails
  return NextResponse.json({
    access_token: authCode.supabase_access_token,
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: authCode.supabase_refresh_token,
    scope: authCode.scope || "mcp:tools",
  });
}

async function handleRefreshToken(body: FormData) {
  const refreshToken = body.get("refresh_token") as string;
  const clientId = body.get("client_id") as string;

  if (!refreshToken || !clientId) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing refresh_token or client_id" },
      { status: 400 }
    );
  }

  // Verify client exists
  const supabase = getServiceClient();
  const { data: client } = await supabase
    .from("mcp_oauth_clients")
    .select("client_id")
    .eq("client_id", clientId)
    .maybeSingle();

  if (!client) {
    return NextResponse.json(
      { error: "invalid_client", error_description: "Unknown client_id" },
      { status: 400 }
    );
  }

  // Use Supabase to refresh the session
  const anonClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: session, error } = await anonClient.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !session.session) {
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Failed to refresh session" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    access_token: session.session.access_token,
    token_type: "bearer",
    expires_in: session.session.expires_in,
    refresh_token: session.session.refresh_token,
    scope: "mcp:tools",
  });
}
