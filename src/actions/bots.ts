"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BotProfile } from "@/types";

export async function createBot(
  name: string,
  role: string | null,
  systemPrompt: string | null,
  avatarUrl: string | null
): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  if (!name.trim()) throw new Error("Agent name is required");
  if (name.length > 100) throw new Error("Agent name must be 100 characters or less");

  const { data, error } = await supabase.rpc("create_bot_user", {
    p_name: name.trim(),
    p_owner_id: user.id,
    p_role: role?.trim() || null,
    p_system_prompt: systemPrompt?.trim() || null,
    p_avatar_url: avatarUrl?.trim() || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/agents");
  return data as string;
}

export async function updateBot(
  botId: string,
  updates: {
    name?: string;
    role?: string | null;
    system_prompt?: string | null;
    avatar_url?: string | null;
    is_active?: boolean;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  if (updates.name !== undefined) {
    if (!updates.name.trim()) throw new Error("Agent name is required");
    if (updates.name.length > 100)
      throw new Error("Agent name must be 100 characters or less");
  }

  // Update bot_profiles
  const profileUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) profileUpdates.name = updates.name.trim();
  if (updates.role !== undefined) profileUpdates.role = updates.role?.trim() || null;
  if (updates.system_prompt !== undefined)
    profileUpdates.system_prompt = updates.system_prompt?.trim() || null;
  if (updates.avatar_url !== undefined)
    profileUpdates.avatar_url = updates.avatar_url?.trim() || null;
  if (updates.is_active !== undefined) profileUpdates.is_active = updates.is_active;

  if (Object.keys(profileUpdates).length > 0) {
    const { error } = await supabase
      .from("bot_profiles")
      .update(profileUpdates)
      .eq("id", botId)
      .eq("owner_id", user.id);

    if (error) throw new Error(error.message);
  }

  // Sync users.full_name / avatar_url via SECURITY DEFINER RPC
  // (RLS on users only allows auth.uid() = id, so direct updates silently fail)
  if (updates.name !== undefined || updates.avatar_url !== undefined) {
    const { error: syncError } = await supabase.rpc("update_bot_user", {
      p_bot_id: botId,
      p_owner_id: user.id,
      p_name: updates.name !== undefined ? updates.name.trim() : null,
      p_avatar_url: updates.avatar_url !== undefined ? (updates.avatar_url?.trim() || null) : null,
    });

    if (syncError) throw new Error(syncError.message);
  }

  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/agents");
  revalidatePath("/ideas");
}

export async function deleteBot(botId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("delete_bot_user", {
    p_bot_id: botId,
    p_owner_id: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/profile/${user.id}`);
  revalidatePath("/agents");
}

export async function listMyBots(): Promise<BotProfile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("bot_profiles")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as BotProfile[];
}
