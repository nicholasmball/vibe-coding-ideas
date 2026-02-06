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
