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
  const url = new URL(request.url);
  const clientId = url.searchParams.get("client_id");
  const redirectUri = url.searchParams.get("redirect_uri");
  const codeChallenge = url.searchParams.get("code_challenge");
  const codeChallengeMethod = url.searchParams.get("code_challenge_method");
  const state = url.searchParams.get("state");
  const scope = url.searchParams.get("scope") || "";

  if (!clientId || !redirectUri || !codeChallenge || !state) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Missing required parameters: client_id, redirect_uri, code_challenge, state" },
      { status: 400 }
    );
  }

  if (codeChallengeMethod && codeChallengeMethod !== "S256") {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Only S256 code_challenge_method is supported" },
      { status: 400 }
    );
  }

  // Validate client_id and redirect_uri
  const supabase = getServiceClient();
  const { data: client, error } = await supabase
    .from("mcp_oauth_clients")
    .select("client_id, redirect_uris")
    .eq("client_id", clientId)
    .maybeSingle();

  if (error || !client) {
    return NextResponse.json(
      { error: "invalid_client", error_description: "Unknown client_id" },
      { status: 400 }
    );
  }

  if (!client.redirect_uris.includes(redirectUri)) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "redirect_uri not registered for this client" },
      { status: 400 }
    );
  }

  // Redirect to the consent/login page with all OAuth params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vibe-coding-ideas.vercel.app";
  const loginUrl = new URL(`${baseUrl}/oauth/authorize`);
  loginUrl.searchParams.set("client_id", clientId);
  loginUrl.searchParams.set("redirect_uri", redirectUri);
  loginUrl.searchParams.set("code_challenge", codeChallenge);
  loginUrl.searchParams.set("code_challenge_method", codeChallengeMethod || "S256");
  loginUrl.searchParams.set("state", state);
  loginUrl.searchParams.set("scope", scope);

  return NextResponse.redirect(loginUrl.toString());
}
