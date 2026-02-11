import { z } from "zod";
import { logActivity } from "../activity";
import type { McpContext } from "../context";

export const addIdeaCommentSchema = z.object({
  idea_id: z.string().uuid().describe("The idea ID"),
  content: z.string().min(1).max(5000).describe("Comment content (markdown)"),
  type: z
    .enum(["comment", "suggestion", "question"])
    .default("comment")
    .describe("Comment type"),
});

export async function addIdeaComment(
  ctx: McpContext,
  params: z.infer<typeof addIdeaCommentSchema>
) {
  const { data, error } = await ctx.supabase
    .from("comments")
    .insert({
      idea_id: params.idea_id,
      author_id: ctx.userId,
      content: params.content,
      type: params.type,
    })
    .select("id, content, type, created_at")
    .single();

  if (error) throw new Error(`Failed to add comment: ${error.message}`);
  return { success: true, comment: data };
}

export const addTaskCommentSchema = z.object({
  task_id: z.string().uuid().describe("The task ID"),
  idea_id: z.string().uuid().describe("The idea ID"),
  content: z.string().min(1).max(5000).describe("Comment content (markdown)"),
});

export async function addTaskComment(
  ctx: McpContext,
  params: z.infer<typeof addTaskCommentSchema>
) {
  const { data, error } = await ctx.supabase
    .from("board_task_comments")
    .insert({
      task_id: params.task_id,
      idea_id: params.idea_id,
      author_id: ctx.userId,
      content: params.content,
    })
    .select("id, content, created_at")
    .single();

  if (error) throw new Error(`Failed to add task comment: ${error.message}`);

  await logActivity(ctx, params.task_id, params.idea_id, "comment_added");

  return { success: true, comment: data };
}
