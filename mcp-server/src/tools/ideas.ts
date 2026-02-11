import { z } from "zod";
import type { McpContext } from "../context";

export const listIdeasSchema = z.object({
  status: z
    .enum(["open", "in_progress", "completed", "archived"])
    .optional()
    .describe("Filter by idea status"),
  search: z.string().optional().describe("Search in title and description"),
  limit: z
    .number()
    .min(1)
    .max(50)
    .default(20)
    .describe("Max results (default 20)"),
});

export async function listIdeas(ctx: McpContext, params: z.infer<typeof listIdeasSchema>) {
  let query = ctx.supabase
    .from("ideas")
    .select("id, title, status, tags, upvotes, comment_count, collaborator_count, created_at, users!ideas_author_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(params.limit);

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.search) {
    query = query.or(
      `title.ilike.%${params.search}%,description.ilike.%${params.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list ideas: ${error.message}`);

  return data.map((idea) => ({
    ...idea,
    author: (idea as Record<string, unknown>).users,
    users: undefined,
  }));
}

export const getIdeaSchema = z.object({
  idea_id: z.string().uuid().describe("The idea ID"),
});

export async function getIdea(ctx: McpContext, params: z.infer<typeof getIdeaSchema>) {
  // Fetch idea with author
  const { data: idea, error } = await ctx.supabase
    .from("ideas")
    .select("*, users!ideas_author_id_fkey(id, full_name, email)")
    .eq("id", params.idea_id)
    .maybeSingle();

  if (error) throw new Error(`Failed to get idea: ${error.message}`);
  if (!idea) throw new Error(`Idea not found: ${params.idea_id}`);

  // Fetch comments count by type
  const { data: comments } = await ctx.supabase
    .from("comments")
    .select("id, type, content, created_at, users!comments_author_id_fkey(full_name)")
    .eq("idea_id", params.idea_id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch collaborators
  const { data: collaborators } = await ctx.supabase
    .from("collaborators")
    .select("users!collaborators_user_id_fkey(id, full_name, email)")
    .eq("idea_id", params.idea_id);

  // Fetch board summary (column counts)
  const { data: columns } = await ctx.supabase
    .from("board_columns")
    .select("id, title, is_done_column")
    .eq("idea_id", params.idea_id);

  let boardSummary = null;
  if (columns && columns.length > 0) {
    const { data: tasks } = await ctx.supabase
      .from("board_tasks")
      .select("id, column_id, archived")
      .eq("idea_id", params.idea_id)
      .eq("archived", false);

    boardSummary = columns.map((col) => ({
      column: col.title,
      is_done: col.is_done_column,
      task_count: tasks?.filter((t) => t.column_id === col.id).length ?? 0,
    }));
  }

  return {
    ...idea,
    author: (idea as Record<string, unknown>).users,
    users: undefined,
    recent_comments: comments ?? [],
    collaborators:
      collaborators?.map((c) => (c as Record<string, unknown>).users) ?? [],
    board_summary: boardSummary,
  };
}

export const updateIdeaDescriptionSchema = z.object({
  idea_id: z.string().uuid().describe("The idea ID"),
  description: z
    .string()
    .min(1)
    .max(10000)
    .describe("New description (markdown supported)"),
});

export async function updateIdeaDescription(
  ctx: McpContext,
  params: z.infer<typeof updateIdeaDescriptionSchema>
) {
  const { data, error } = await ctx.supabase
    .from("ideas")
    .update({ description: params.description })
    .eq("id", params.idea_id)
    .select("id, title")
    .single();

  if (error) throw new Error(`Failed to update idea: ${error.message}`);
  return { success: true, idea: data };
}
