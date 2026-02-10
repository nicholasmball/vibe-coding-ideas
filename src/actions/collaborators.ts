"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleCollaborator(ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if already a collaborator
  const { data: existing } = await supabase
    .from("collaborators")
    .select()
    .eq("idea_id", ideaId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Remove
    await supabase
      .from("collaborators")
      .delete()
      .eq("idea_id", ideaId)
      .eq("user_id", user.id);
  } else {
    // Add
    await supabase.from("collaborators").insert({
      idea_id: ideaId,
      user_id: user.id,
    });
  }

  revalidatePath(`/ideas/${ideaId}`);
}

export async function addCollaborator(ideaId: string, userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Verify caller is the idea author
  const { data: idea } = await supabase
    .from("ideas")
    .select("author_id")
    .eq("id", ideaId)
    .single();

  if (!idea || idea.author_id !== user.id) {
    throw new Error("Only the idea author can add collaborators");
  }

  const { error } = await supabase.from("collaborators").insert({
    idea_id: ideaId,
    user_id: userId,
  });

  // Ignore unique constraint violation (already a collaborator)
  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }

  revalidatePath(`/ideas/${ideaId}`);
}

export async function removeCollaborator(ideaId: string, userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Verify caller is the idea author
  const { data: idea } = await supabase
    .from("ideas")
    .select("author_id")
    .eq("id", ideaId)
    .single();

  if (!idea || idea.author_id !== user.id) {
    throw new Error("Only the idea author can remove collaborators");
  }

  await supabase
    .from("collaborators")
    .delete()
    .eq("idea_id", ideaId)
    .eq("user_id", userId);

  revalidatePath(`/ideas/${ideaId}`);
}
