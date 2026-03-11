import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  console.log("[oauth/code] POST handler invoked");
  try {
    console.log("[oauth/code] Parsing request body...");
    const body = await request.json();
    const {
      code,
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method,
      scope,
      supabase_access_token,
      supabase_refresh_token,
    } = body;

    console.log("[oauth/code] Fields present:", JSON.stringify({
      code: !!code, client_id: !!client_id, redirect_uri: !!redirect_uri,
      code_challenge: !!code_challenge, supabase_access_token: !!supabase_access_token,
      supabase_refresh_token: !!supabase_refresh_token,
    }));

    if (!code || !client_id || !redirect_uri || !code_challenge || !supabase_access_token || !supabase_refresh_token) {
      console.log("[oauth/code] Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the access token to get the user ID
    console.log("[oauth/code] Verifying access token...");
    const supabase = getServiceClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser(supabase_access_token);

    if (userError || !user) {
      console.log("[oauth/code] Token verification failed:", userError?.message);
      return NextResponse.json(
        { error: "Invalid access token" },
        { status: 401 }
      );
    }

    // Store the authorization code
    console.log("[oauth/code] Storing authorization code for user:", user.id);
    const { error } = await supabase
      .from("mcp_oauth_codes")
      .insert({
        code,
        client_id,
        user_id: user.id,
        redirect_uri,
        code_challenge,
        code_challenge_method: code_challenge_method || "S256",
        supabase_access_token,
        supabase_refresh_token,
        scope: scope || "",
      });

    if (error) {
      console.error("[oauth/code] Insert error:", error.message, error.code, error.details);
      return NextResponse.json(
        { error: "Failed to store authorization code" },
        { status: 500 }
      );
    }

    console.log("[oauth/code] Success");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[oauth/code] Unhandled error:", err instanceof Error ? { message: err.message, stack: err.stack, name: err.name } : err);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
