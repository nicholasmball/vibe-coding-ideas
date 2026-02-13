import { z } from "zod";
import { POSITION_GAP } from "../constants";
import type { McpContext } from "../context";

// --- Create Column ---

export const createColumnSchema = z.object({
  idea_id: z.string().uuid().describe("The idea ID"),
  title: z.string().min(1).max(200).describe("Column title"),
  is_done_column: z
    .boolean()
    .default(false)
    .describe("Whether tasks in this column are considered complete"),
});

export async function createColumn(
  ctx: McpContext,
  params: z.infer<typeof createColumnSchema>
) {
  // Get max position
  const { data: cols } = await ctx.supabase
    .from("board_columns")
    .select("position")
    .eq("idea_id", params.idea_id)
    .order("position", { ascending: false })
    .limit(1);

  const maxPos = cols?.[0]?.position ?? -POSITION_GAP;

  const { data, error } = await ctx.supabase
    .from("board_columns")
    .insert({
      idea_id: params.idea_id,
      title: params.title,
      position: maxPos + POSITION_GAP,
      is_done_column: params.is_done_column,
    })
    .select("id, title, position, is_done_column")
    .single();

  if (error) throw new Error(`Failed to create column: ${error.message}`);
  return { success: true, column: data };
}

// --- Update Column ---

export const updateColumnSchema = z.object({
  column_id: z.string().uuid().describe("The column ID"),
  idea_id: z.string().uuid().describe("The idea ID"),
  title: z.string().min(1).max(200).optional().describe("New column title"),
  is_done_column: z
    .boolean()
    .optional()
    .describe("Whether tasks in this column are considered complete"),
});

export async function updateColumn(
  ctx: McpContext,
  params: z.infer<typeof updateColumnSchema>
) {
  const updates: Record<string, unknown> = {};
  if (params.title !== undefined) updates.title = params.title;
  if (params.is_done_column !== undefined) updates.is_done_column = params.is_done_column;

  if (Object.keys(updates).length === 0) {
    return { success: true, message: "No changes to apply" };
  }

  const { data, error } = await ctx.supabase
    .from("board_columns")
    .update(updates)
    .eq("id", params.column_id)
    .eq("idea_id", params.idea_id)
    .select("id, title, position, is_done_column")
    .single();

  if (error) throw new Error(`Failed to update column: ${error.message}`);
  return { success: true, column: data };
}

// --- Delete Column ---

export const deleteColumnSchema = z.object({
  column_id: z.string().uuid().describe("The column ID"),
  idea_id: z.string().uuid().describe("The idea ID"),
});

export async function deleteColumn(
  ctx: McpContext,
  params: z.infer<typeof deleteColumnSchema>
) {
  // Check if column has tasks
  const { data: tasks } = await ctx.supabase
    .from("board_tasks")
    .select("id")
    .eq("column_id", params.column_id)
    .eq("idea_id", params.idea_id)
    .limit(1);

  if (tasks && tasks.length > 0) {
    throw new Error(
      "Cannot delete a column that has tasks. Move or delete the tasks first."
    );
  }

  const { error } = await ctx.supabase
    .from("board_columns")
    .delete()
    .eq("id", params.column_id)
    .eq("idea_id", params.idea_id);

  if (error) throw new Error(`Failed to delete column: ${error.message}`);
  return { success: true };
}

// --- Reorder Columns ---

export const reorderColumnsSchema = z.object({
  idea_id: z.string().uuid().describe("The idea ID"),
  column_ids: z
    .array(z.string().uuid())
    .min(1)
    .describe("Array of column IDs in the desired order"),
});

export async function reorderColumns(
  ctx: McpContext,
  params: z.infer<typeof reorderColumnsSchema>
) {
  // Update each column's position based on array index
  for (let i = 0; i < params.column_ids.length; i++) {
    const { error } = await ctx.supabase
      .from("board_columns")
      .update({ position: i * POSITION_GAP })
      .eq("id", params.column_ids[i])
      .eq("idea_id", params.idea_id);

    if (error) throw new Error(`Failed to reorder columns: ${error.message}`);
  }

  return { success: true, order: params.column_ids };
}
