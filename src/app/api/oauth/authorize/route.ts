import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  console.log("[oauth/authorize] GET handler invoked");
  try {
    const url = new URL(request.url);
    const clientId = url.searchParams.get("client_id");
    const redirectUri = url.searchParams.get("redirect_uri");
    const codeChallenge = url.searchParams.get("code_challenge");
    const codeChallengeMethod = url.searchParams.get("code_challenge_method");
    const state = url.searchParams.get("state");
    const scope = url.searchParams.get("scope") || "";

    console.log("[oauth/authorize] Params:", JSON.stringify({ clientId, redirectUri: redirectUri?.substring(0, 50), codeChallenge: !!codeChallenge, state: !!state, scope }));

    if (!clientId || !redirectUri || !codeChallenge || !state) {
      console.log("[oauth/authorize] Missing required params");
      return NextResponse.json(
        { error: "invalid_request", error_description: "Missing required parameters: client_id, redirect_uri, code_challenge, state" },
        { status: 400 }
      );
    }

    if (codeChallengeMethod && codeChallengeMethod !== "S256") {
      console.log("[oauth/authorize] Invalid code_challenge_method:", codeChallengeMethod);
      return NextResponse.json(
        { error: "invalid_request", error_description: "Only S256 code_challenge_method is supported" },
        { status: 400 }
      );
    }

    // Validate client_id and redirect_uri
    console.log("[oauth/authorize] Looking up client...");
    const supabase = getServiceClient();
    const { data: client, error } = await supabase
      .from("mcp_oauth_clients")
      .select("client_id, redirect_uris")
      .eq("client_id", clientId)
      .maybeSingle();

    if (error || !client) {
      console.log("[oauth/authorize] Client lookup failed:", error?.message || "not found");
      return NextResponse.json(
        { error: "invalid_client", error_description: "Unknown client_id" },
        { status: 400 }
      );
    }

    if (!client.redirect_uris.includes(redirectUri)) {
      console.log("[oauth/authorize] redirect_uri not registered");
      return NextResponse.json(
        { error: "invalid_request", error_description: "redirect_uri not registered for this client" },
        { status: 400 }
      );
    }

    // Redirect to the consent/login page with all OAuth params
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error("[oauth/authorize] NEXT_PUBLIC_APP_URL not configured");
      return NextResponse.json(
        { error: "server_error", error_description: "NEXT_PUBLIC_APP_URL is not configured" },
        { status: 500 }
      );
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const loginUrl = new URL(`${baseUrl}/oauth/authorize`);
    loginUrl.searchParams.set("client_id", clientId);
    loginUrl.searchParams.set("redirect_uri", redirectUri);
    loginUrl.searchParams.set("code_challenge", codeChallenge);
    loginUrl.searchParams.set("code_challenge_method", codeChallengeMethod || "S256");
    loginUrl.searchParams.set("state", state);
    loginUrl.searchParams.set("scope", scope);

    console.log("[oauth/authorize] Redirecting to consent page");
    return NextResponse.redirect(loginUrl.toString());
  } catch (err) {
    console.error("[oauth/authorize] Unhandled error:", err instanceof Error ? { message: err.message, stack: err.stack, name: err.name } : err);
    return NextResponse.json(
      { error: "server_error", error_description: "Internal server error" },
      { status: 500 }
    );
  }
}
