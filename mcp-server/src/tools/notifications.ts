import { z } from "zod";
import type { McpContext } from "../context";

// --- List Notifications ---

export const listNotificationsSchema = z.object({
  unread_only: z
    .boolean()
    .default(false)
    .describe("Only return unread notifications"),
  limit: z
    .number()
    .min(1)
    .max(50)
    .default(20)
    .describe("Max results (default 20)"),
});

export async function listNotifications(
  ctx: McpContext,
  params: z.infer<typeof listNotificationsSchema>
) {
  let query = ctx.supabase
    .from("notifications")
    .select(
      "id, type, read, created_at, actor:users!notifications_actor_id_fkey(id, full_name), idea:ideas!notifications_idea_id_fkey(id, title)"
    )
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(params.limit);

  if (params.unread_only) {
    query = query.eq("read", false);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list notifications: ${error.message}`);

  return {
    notifications: data ?? [],
    total: (data ?? []).length,
    unread_count: (data ?? []).filter((n) => !n.read).length,
  };
}

// --- Mark Notification Read ---

export const markNotificationReadSchema = z.object({
  notification_id: z.string().uuid().describe("The notification ID to mark as read"),
});

export async function markNotificationRead(
  ctx: McpContext,
  params: z.infer<typeof markNotificationReadSchema>
) {
  const { error } = await ctx.supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", params.notification_id)
    .eq("user_id", ctx.userId);

  if (error) throw new Error(`Failed to mark notification read: ${error.message}`);
  return { success: true, notification_id: params.notification_id };
}

// --- Mark All Notifications Read ---

export const markAllNotificationsReadSchema = z.object({});

export async function markAllNotificationsRead(ctx: McpContext) {
  const { error } = await ctx.supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", ctx.userId)
    .eq("read", false);

  if (error) throw new Error(`Failed to mark all notifications read: ${error.message}`);
  return { success: true };
}
