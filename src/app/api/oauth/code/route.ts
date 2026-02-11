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
  try {
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

    if (!code || !client_id || !redirect_uri || !code_challenge || !supabase_access_token || !supabase_refresh_token) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the access token to get the user ID
    const supabase = getServiceClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser(supabase_access_token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid access token" },
        { status: 401 }
      );
    }

    // Store the authorization code
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
      return NextResponse.json(
        { error: "Failed to store authorization code" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
