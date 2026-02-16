import { z } from "zod";
import type { McpContext } from "../context";

export const toggleVoteSchema = z.object({
  idea_id: z.string().uuid().describe("The idea ID"),
});

export async function toggleVote(
  ctx: McpContext,
  params: z.infer<typeof toggleVoteSchema>
) {
  // Check if user already voted
  const { data: existingVote } = await ctx.supabase
    .from("votes")
    .select("id")
    .eq("idea_id", params.idea_id)
    .eq("user_id", ctx.ownerUserId ?? ctx.userId)
    .maybeSingle();

  if (existingVote) {
    // Remove vote
    const { error } = await ctx.supabase
      .from("votes")
      .delete()
      .eq("idea_id", params.idea_id)
      .eq("user_id", ctx.ownerUserId ?? ctx.userId);

    if (error) throw new Error(`Failed to remove vote: ${error.message}`);
    return { success: true, action: "removed", voted: false };
  } else {
    // Add vote
    const { error } = await ctx.supabase.from("votes").insert({
      idea_id: params.idea_id,
      user_id: ctx.ownerUserId ?? ctx.userId,
      type: "upvote",
    });

    if (error) throw new Error(`Failed to add vote: ${error.message}`);
    return { success: true, action: "added", voted: true };
  }
}
