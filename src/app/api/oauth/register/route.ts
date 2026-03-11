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
  console.log("[oauth/register] POST handler invoked");
  try {
    console.log("[oauth/register] Parsing request body...");
    const body = await request.json();
    console.log("[oauth/register] Body parsed:", JSON.stringify(body));
    const { redirect_uris, client_name } = body;

    if (!redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
      console.log("[oauth/register] Invalid redirect_uris:", redirect_uris);
      return NextResponse.json(
        { error: "invalid_client_metadata", error_description: "redirect_uris is required" },
        { status: 400 }
      );
    }

    const clientSecret = crypto.randomBytes(32).toString("hex");
    console.log("[oauth/register] Creating Supabase client...");
    const supabase = getServiceClient();

    console.log("[oauth/register] Inserting OAuth client...");
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
      console.error("[oauth/register] Supabase insert error:", error.message, error.code, error.details);
      return NextResponse.json(
        { error: "server_error", error_description: error.message },
        { status: 500 }
      );
    }

    console.log("[oauth/register] Success, client_id:", data.client_id);
    return NextResponse.json({
      client_id: data.client_id,
      client_secret: clientSecret,
      redirect_uris,
      client_name: client_name || undefined,
      token_endpoint_auth_method: "client_secret_post",
    }, { status: 201 });
  } catch (err) {
    console.error("[oauth/register] Unhandled error:", err instanceof Error ? { message: err.message, stack: err.stack, name: err.name } : err);
    return NextResponse.json(
      { error: "invalid_request", error_description: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
