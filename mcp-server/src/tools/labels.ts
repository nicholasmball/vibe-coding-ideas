import { z } from "zod";
import { POSITION_GAP, VALID_LABEL_COLORS } from "../constants";
import { logActivity } from "../activity";
import type { McpContext } from "../context";

// --- manage_labels ---

export const manageLabelsSchema = z.object({
  idea_id: z.string().uuid().describe("The idea ID"),
  action: z
    .enum(["create", "add_to_task", "remove_from_task"])
    .describe("Action to perform"),
  // For "create"
  name: z.string().min(1).max(50).optional().describe("Label name (for create)"),
  color: z
    .string()
    .optional()
    .describe("Label color (for create): red, orange, amber, yellow, lime, green, blue, cyan, violet, purple, pink, rose, emerald, zinc"),
  // For "add_to_task" / "remove_from_task"
  task_id: z.string().uuid().optional().describe("Task ID (for add/remove)"),
  label_id: z
    .string()
    .uuid()
    .optional()
    .describe("Label ID (for add/remove)"),
});

export async function manageLabels(
  ctx: McpContext,
  params: z.infer<typeof manageLabelsSchema>
) {
  if (params.action === "create") {
    if (!params.name) throw new Error("name is required for create");
    const color = params.color ?? "blue";
    if (!VALID_LABEL_COLORS.includes(color)) {
      throw new Error(`Invalid color: ${color}. Valid: ${VALID_LABEL_COLORS.join(", ")}`);
    }

    const { data, error } = await ctx.supabase
      .from("board_labels")
      .insert({ idea_id: params.idea_id, name: params.name, color })
      .select("id, name, color")
      .single();

    if (error) throw new Error(`Failed to create label: ${error.message}`);
    return { success: true, label: data };
  }

  if (params.action === "add_to_task") {
    if (!params.task_id || !params.label_id)
      throw new Error("task_id and label_id are required for add_to_task");

    const { error } = await ctx.supabase
      .from("board_task_labels")
      .insert({ task_id: params.task_id, label_id: params.label_id });

    if (error) throw new Error(`Failed to add label: ${error.message}`);

    // Get label name for activity
    const { data: label } = await ctx.supabase
      .from("board_labels")
      .select("name")
      .eq("id", params.label_id)
      .single();

    await logActivity(ctx, params.task_id, params.idea_id, "label_added", {
      label_name: label?.name ?? params.label_id,
    });

    return { success: true };
  }

  if (params.action === "remove_from_task") {
    if (!params.task_id || !params.label_id)
      throw new Error("task_id and label_id are required for remove_from_task");

    // Get label name for activity
    const { data: label } = await ctx.supabase
      .from("board_labels")
      .select("name")
      .eq("id", params.label_id)
      .single();

    const { error } = await ctx.supabase
      .from("board_task_labels")
      .delete()
      .eq("task_id", params.task_id)
      .eq("label_id", params.label_id);

    if (error) throw new Error(`Failed to remove label: ${error.message}`);

    await logActivity(ctx, params.task_id, params.idea_id, "label_removed", {
      label_name: label?.name ?? params.label_id,
    });

    return { success: true };
  }

  throw new Error(`Unknown action: ${params.action}`);
}

// --- report_bug ---

export const reportBugSchema = z.object({
  idea_id: z.string().uuid().describe("The idea ID"),
  title: z.string().min(1).max(200).describe("Bug title"),
  description: z
    .string()
    .max(10000)
    .optional()
    .describe("Bug description (markdown)"),
  column_id: z
    .string()
    .uuid()
    .optional()
    .describe("Column ID (defaults to first/To Do column)"),
});

export async function reportBug(ctx: McpContext, params: z.infer<typeof reportBugSchema>) {
  // Find or determine the target column
  let columnId = params.column_id;
  if (!columnId) {
    const { data: columns } = await ctx.supabase
      .from("board_columns")
      .select("id")
      .eq("idea_id", params.idea_id)
      .order("position")
      .limit(1);

    if (!columns || columns.length === 0) {
      throw new Error("No board columns found. Use get_board first to initialize the board.");
    }
    columnId = columns[0].id;
  }

  // Get next position
  const { data: posData } = await ctx.supabase
    .from("board_tasks")
    .select("position")
    .eq("column_id", columnId)
    .eq("idea_id", params.idea_id)
    .order("position", { ascending: false })
    .limit(1);

  const position = (posData?.[0]?.position ?? -POSITION_GAP) + POSITION_GAP;

  // Create the task
  const { data: task, error } = await ctx.supabase
    .from("board_tasks")
    .insert({
      idea_id: params.idea_id,
      column_id: columnId,
      title: params.title,
      description: params.description ?? null,
      assignee_id: ctx.userId,
      position,
    })
    .select("id, title")
    .single();

  if (error) throw new Error(`Failed to create bug task: ${error.message}`);

  await logActivity(ctx, task.id, params.idea_id, "created");

  // Find or create "Bug" label (red)
  let { data: bugLabel } = await ctx.supabase
    .from("board_labels")
    .select("id")
    .eq("idea_id", params.idea_id)
    .eq("name", "Bug")
    .maybeSingle();

  if (!bugLabel) {
    const { data: newLabel, error: labelError } = await ctx.supabase
      .from("board_labels")
      .insert({ idea_id: params.idea_id, name: "Bug", color: "red" })
      .select("id")
      .single();

    if (labelError)
      throw new Error(`Failed to create Bug label: ${labelError.message}`);
    bugLabel = newLabel;
  }

  // Attach label to task
  await ctx.supabase
    .from("board_task_labels")
    .insert({ task_id: task.id, label_id: bugLabel.id });

  await logActivity(ctx, task.id, params.idea_id, "label_added", {
    label_name: "Bug",
  });

  await logActivity(ctx, task.id, params.idea_id, "assigned", {
    assignee_id: ctx.userId,
  });

  return { success: true, task, label: { id: bugLabel.id, name: "Bug", color: "red" } };
}
