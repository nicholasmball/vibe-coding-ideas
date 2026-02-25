"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleVote(ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from("votes")
    .select()
    .eq("idea_id", ideaId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingVote) {
    // Remove vote
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("idea_id", ideaId)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
  } else {
    // Add vote
    const { error } = await supabase.from("votes").insert({
      idea_id: ideaId,
      user_id: user.id,
      type: "upvote",
    });

    if (error) throw new Error(error.message);
  }

  revalidatePath(`/ideas/${ideaId}`);
  revalidatePath("/ideas");
}
