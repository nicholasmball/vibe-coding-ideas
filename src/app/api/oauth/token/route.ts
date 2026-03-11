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
  console.log("[oauth/token] POST handler invoked");
  try {
    const body = await request.formData();
    const grantType = body.get("grant_type") as string;
    console.log("[oauth/token] grant_type:", grantType);

    if (grantType === "authorization_code") {
      return await handleAuthorizationCode(body);
    }

    if (grantType === "refresh_token") {
      return await handleRefreshToken(body);
    }

    console.log("[oauth/token] Unsupported grant_type:", grantType);
    return NextResponse.json(
      { error: "unsupported_grant_type", error_description: "Supported: authorization_code, refresh_token" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[oauth/token] Unhandled error:", err instanceof Error ? { message: err.message, stack: err.stack, name: err.name } : err);
    return NextResponse.json(
      { error: "server_error", error_description: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleAuthorizationCode(body: FormData) {
  const code = body.get("code") as string;
  const codeVerifier = body.get("code_verifier") as string;
  const clientId = body.get("client_id") as string;
  const redirectUri = body.get("redirect_uri") as string;

  console.log("[oauth/token] authorization_code flow, client_id:", clientId, "has_code:", !!code, "has_verifier:", !!codeVerifier);

  if (!code || !codeVerifier || !clientId) {
    console.log("[oauth/token] Missing required params");
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing required parameters" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  // Look up the authorization code
  console.log("[oauth/token] Looking up authorization code...");
  const { data: authCode, error } = await supabase
    .from("mcp_oauth_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error || !authCode) {
    console.log("[oauth/token] Code lookup failed:", error?.message || "not found");
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Invalid authorization code" },
      { status: 400 }
    );
  }

  // Check not expired
  if (new Date(authCode.expires_at) < new Date()) {
    console.log("[oauth/token] Code expired at:", authCode.expires_at);
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Authorization code expired" },
      { status: 400 }
    );
  }

  // Check not used
  if (authCode.used) {
    console.log("[oauth/token] Code already used");
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Authorization code already used" },
      { status: 400 }
    );
  }

  // Verify client_id matches
  if (authCode.client_id !== clientId) {
    console.log("[oauth/token] client_id mismatch:", authCode.client_id, "!==", clientId);
    return NextResponse.json(
      { error: "invalid_grant", error_description: "client_id mismatch" },
      { status: 400 }
    );
  }

  // Verify redirect_uri if stored
  if (redirectUri && authCode.redirect_uri !== redirectUri) {
    console.log("[oauth/token] redirect_uri mismatch");
    return NextResponse.json(
      { error: "invalid_grant", error_description: "redirect_uri mismatch" },
      { status: 400 }
    );
  }

  // Verify PKCE: SHA256(code_verifier) === code_challenge
  const computedChallenge = base64URLEncode(sha256(codeVerifier));
  if (computedChallenge !== authCode.code_challenge) {
    console.log("[oauth/token] PKCE verification failed");
    return NextResponse.json(
      { error: "invalid_grant", error_description: "PKCE verification failed" },
      { status: 400 }
    );
  }

  // Mark as used
  console.log("[oauth/token] Marking code as used...");
  await supabase
    .from("mcp_oauth_codes")
    .update({ used: true })
    .eq("code", code);

  // Refresh the session to get fresh tokens with full TTL
  // (the stored tokens may already be partially expired)
  console.log("[oauth/token] Refreshing Supabase session...");
  const anonClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: refreshed, error: refreshError } = await anonClient.auth.refreshSession({
    refresh_token: authCode.supabase_refresh_token,
  });

  if (refreshError || !refreshed.session) {
    console.error("[oauth/token] Session refresh failed:", refreshError?.message);
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Session expired — please re-authenticate" },
      { status: 400 }
    );
  }

  console.log("[oauth/token] authorization_code flow complete");
  return NextResponse.json({
    access_token: refreshed.session.access_token,
    token_type: "bearer",
    expires_in: refreshed.session.expires_in,
    refresh_token: refreshed.session.refresh_token,
    scope: authCode.scope || "mcp:tools",
  });
}

async function handleRefreshToken(body: FormData) {
  const refreshToken = body.get("refresh_token") as string;
  const clientId = body.get("client_id") as string;

  console.log("[oauth/token] refresh_token flow, client_id:", clientId, "has_token:", !!refreshToken);

  if (!refreshToken || !clientId) {
    console.log("[oauth/token] Missing refresh_token or client_id");
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing refresh_token or client_id" },
      { status: 400 }
    );
  }

  // Verify client exists
  console.log("[oauth/token] Verifying client...");
  const supabase = getServiceClient();
  const { data: client } = await supabase
    .from("mcp_oauth_clients")
    .select("client_id")
    .eq("client_id", clientId)
    .maybeSingle();

  if (!client) {
    console.log("[oauth/token] Unknown client_id:", clientId);
    return NextResponse.json(
      { error: "invalid_client", error_description: "Unknown client_id" },
      { status: 400 }
    );
  }

  // Use Supabase to refresh the session
  console.log("[oauth/token] Refreshing Supabase session...");
  const anonClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: session, error } = await anonClient.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !session.session) {
    console.error("[oauth/token] Refresh failed:", error?.message);
    return NextResponse.json(
      { error: "invalid_grant", error_description: "Failed to refresh session" },
      { status: 400 }
    );
  }

  console.log("[oauth/token] refresh_token flow complete");
  return NextResponse.json({
    access_token: session.session.access_token,
    token_type: "bearer",
    expires_in: session.session.expires_in,
    refresh_token: session.session.refresh_token,
    scope: "mcp:tools",
  });
}
