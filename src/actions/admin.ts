"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) throw new Error("Admin access required");

  return { supabase, user };
}

export async function toggleAiEnabled(targetUserId: string, enabled: boolean) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("users")
    .update({ ai_enabled: enabled })
    .eq("id", targetUserId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function setUserAiDailyLimit(targetUserId: string, limit: number) {
  const { supabase } = await requireAdmin();

  if (limit < 0) throw new Error("Limit must be non-negative");

  const { error } = await supabase
    .from("users")
    .update({ ai_daily_limit: limit })
    .eq("id", targetUserId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
