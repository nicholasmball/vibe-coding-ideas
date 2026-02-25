import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side auth guard — call at the top of any protected page.
 * Redirects to /login if the user is not authenticated.
 * Returns the authenticated Supabase user and client.
 */
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return { user, supabase };
}
