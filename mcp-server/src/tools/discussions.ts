import { z } from "zod";
import type { McpContext } from "../context";

export const listDiscussionsSchema = z.object({
  idea_id: z.string().uuid().describe("The idea ID"),
  status: z
    .enum(["open", "resolved", "converted"])
    .optional()
    .describe("Filter by discussion status"),
  limit: z
    .number()
    .min(1)
    .max(50)
    .default(20)
    .describe("Max results (default 20)"),
});

export async function listDiscussions(
  ctx: McpContext,
  params: z.infer<typeof listDiscussionsSchema>
) {
  let query = ctx.supabase
    .from("idea_discussions")
    .select(
      "id, title, status, pinned, reply_count, upvotes, last_activity_at, created_at, users!idea_discussions_author_id_fkey(full_name)"
    )
    .eq("idea_id", params.idea_id)
    .order("last_activity_at", { ascending: false })
    .limit(params.limit);

  if (params.status) {
    query = query.eq("status", params.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list discussions: ${error.message}`);

  return data.map((d) => ({
    ...d,
    author: (d as Record<string, unknown>).users,
    users: undefined,
  }));
}

export const getDiscussionSchema = z.object({
  discussion_id: z.string().uuid().describe("The discussion ID"),
  idea_id: z.string().uuid().describe("The idea ID (for context)"),
});

export async function getDiscussion(
  ctx: McpContext,
  params: z.infer<typeof getDiscussionSchema>
) {
  // Fetch discussion with author
  const { data: discussion, error } = await ctx.supabase
    .from("idea_discussions")
    .select(
      "id, title, body, status, pinned, upvotes, reply_count, last_activity_at, created_at, users!idea_discussions_author_id_fkey(id, full_name)"
    )
    .eq("id", params.discussion_id)
    .eq("idea_id", params.idea_id)
    .maybeSingle();

  if (error) throw new Error(`Failed to get discussion: ${error.message}`);
  if (!discussion)
    throw new Error(`Discussion not found: ${params.discussion_id}`);

  // Fetch all replies with authors
  const { data: replies, error: repliesError } = await ctx.supabase
    .from("idea_discussion_replies")
    .select(
      "id, content, parent_reply_id, created_at, updated_at, users!idea_discussion_replies_author_id_fkey(id, full_name)"
    )
    .eq("discussion_id", params.discussion_id)
    .order("created_at", { ascending: true });

  if (repliesError)
    throw new Error(`Failed to get replies: ${repliesError.message}`);

  // Group replies into parent/child structure (single-level nesting)
  const topLevel: unknown[] = [];
  const childMap = new Map<string, unknown[]>();

  for (const reply of replies ?? []) {
    const formatted = {
      id: reply.id,
      content: reply.content,
      parent_reply_id: reply.parent_reply_id,
      created_at: reply.created_at,
      updated_at: reply.updated_at,
      author: (reply as Record<string, unknown>).users,
    };

    if (reply.parent_reply_id) {
      const children = childMap.get(reply.parent_reply_id) ?? [];
      children.push(formatted);
      childMap.set(reply.parent_reply_id, children);
    } else {
      topLevel.push({ ...formatted, replies: [] as unknown[] });
    }
  }

  // Attach children to their parents
  for (const parent of topLevel) {
    const p = parent as { id: string; replies: unknown[] };
    p.replies = childMap.get(p.id) ?? [];
  }

  return {
    ...discussion,
    author: (discussion as Record<string, unknown>).users,
    users: undefined,
    replies: topLevel,
  };
}

export const addDiscussionReplySchema = z.object({
  discussion_id: z.string().uuid().describe("The discussion ID"),
  idea_id: z.string().uuid().describe("The idea ID"),
  content: z
    .string()
    .min(1)
    .max(5000)
    .describe("Reply content (markdown)"),
  parent_reply_id: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .describe("Parent reply ID for nested replies (optional)"),
});

export async function addDiscussionReply(
  ctx: McpContext,
  params: z.infer<typeof addDiscussionReplySchema>
) {
  // Flatten nested replies: if parent has a parent, use grandparent
  let resolvedParentId = params.parent_reply_id ?? null;
  if (resolvedParentId) {
    const { data: parent } = await ctx.supabase
      .from("idea_discussion_replies")
      .select("parent_reply_id")
      .eq("id", resolvedParentId)
      .single();
    if (parent?.parent_reply_id) {
      resolvedParentId = parent.parent_reply_id;
    }
  }

  const { data, error } = await ctx.supabase
    .from("idea_discussion_replies")
    .insert({
      discussion_id: params.discussion_id,
      author_id: ctx.userId,
      content: params.content,
      parent_reply_id: resolvedParentId,
    })
    .select("id, content, created_at")
    .single();

  if (error) throw new Error(`Failed to add discussion reply: ${error.message}`);
  return { success: true, reply: data };
}

export const createDiscussionSchema = z.object({
  idea_id: z.string().uuid().describe("The idea ID"),
  title: z.string().min(1).max(200).describe("Discussion title"),
  body: z
    .string()
    .min(1)
    .max(10000)
    .describe("Discussion body (markdown)"),
});

export async function createDiscussion(
  ctx: McpContext,
  params: z.infer<typeof createDiscussionSchema>
) {
  const { data, error } = await ctx.supabase
    .from("idea_discussions")
    .insert({
      idea_id: params.idea_id,
      author_id: ctx.userId,
      title: params.title,
      body: params.body,
    })
    .select("id, title, created_at")
    .single();

  if (error) throw new Error(`Failed to create discussion: ${error.message}`);
  return { success: true, discussion: data };
}

export const updateDiscussionSchema = z.object({
  discussion_id: z.string().uuid().describe("The discussion ID"),
  idea_id: z.string().uuid().describe("The idea ID"),
  title: z.string().min(1).max(200).optional().describe("New title"),
  body: z.string().min(1).max(10000).optional().describe("New body (markdown)"),
  status: z
    .enum(["open", "resolved", "converted"])
    .optional()
    .describe("New status"),
  pinned: z.boolean().optional().describe("Pin or unpin the discussion"),
});

export async function updateDiscussion(
  ctx: McpContext,
  params: z.infer<typeof updateDiscussionSchema>
) {
  const updates: Record<string, unknown> = {};
  if (params.title !== undefined) updates.title = params.title;
  if (params.body !== undefined) updates.body = params.body;
  if (params.status !== undefined) updates.status = params.status;
  if (params.pinned !== undefined) updates.pinned = params.pinned;

  if (Object.keys(updates).length === 0) {
    throw new Error("No fields to update");
  }

  const { data, error } = await ctx.supabase
    .from("idea_discussions")
    .update(updates)
    .eq("id", params.discussion_id)
    .eq("idea_id", params.idea_id)
    .select("id, title, status, pinned")
    .single();

  if (error) throw new Error(`Failed to update discussion: ${error.message}`);
  return { success: true, discussion: data };
}

export const deleteDiscussionSchema = z.object({
  discussion_id: z.string().uuid().describe("The discussion ID"),
  idea_id: z.string().uuid().describe("The idea ID"),
});

export async function deleteDiscussion(
  ctx: McpContext,
  params: z.infer<typeof deleteDiscussionSchema>
) {
  const { error } = await ctx.supabase
    .from("idea_discussions")
    .delete()
    .eq("id", params.discussion_id)
    .eq("idea_id", params.idea_id);

  if (error) throw new Error(`Failed to delete discussion: ${error.message}`);
  return { success: true, deleted: { id: params.discussion_id } };
}
