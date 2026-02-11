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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { redirect_uris, client_name } = body;

    if (!redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
      return NextResponse.json(
        { error: "invalid_client_metadata", error_description: "redirect_uris is required" },
        { status: 400 }
      );
    }

    const clientSecret = crypto.randomBytes(32).toString("hex");
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("mcp_oauth_clients")
      .insert({
        client_secret: clientSecret,
        redirect_uris,
        client_name: client_name || null,
      })
      .select("client_id")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "server_error", error_description: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      client_id: data.client_id,
      client_secret: clientSecret,
      redirect_uris,
      client_name: client_name || undefined,
      token_endpoint_auth_method: "client_secret_post",
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "invalid_request", error_description: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
