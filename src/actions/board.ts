"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_BOARD_COLUMNS, POSITION_GAP } from "@/lib/constants";

export async function initializeBoardColumns(ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Check if columns already exist
  const { data: existing } = await supabase
    .from("board_columns")
    .select("id")
    .eq("idea_id", ideaId)
    .limit(1);

  if (existing && existing.length > 0) return;

  // Create default columns
  const columns = DEFAULT_BOARD_COLUMNS.map((col) => ({
    idea_id: ideaId,
    title: col.title,
    position: col.position,
  }));

  await supabase.from("board_columns").insert(columns);
}

export async function createBoardColumn(ideaId: string, title: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Get max position
  const { data: cols } = await supabase
    .from("board_columns")
    .select("position")
    .eq("idea_id", ideaId)
    .order("position", { ascending: false })
    .limit(1);

  const maxPos = cols && cols.length > 0 ? cols[0].position : -POSITION_GAP;

  const { error } = await supabase.from("board_columns").insert({
    idea_id: ideaId,
    title,
    position: maxPos + POSITION_GAP,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function updateBoardColumn(
  columnId: string,
  ideaId: string,
  title: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("board_columns")
    .update({ title })
    .eq("id", columnId)
    .eq("idea_id", ideaId);

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function deleteBoardColumn(columnId: string, ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("board_columns")
    .delete()
    .eq("id", columnId)
    .eq("idea_id", ideaId);

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function reorderBoardColumns(
  ideaId: string,
  columnIds: string[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Update each column's position based on array index
  const updates = columnIds.map((id, index) =>
    supabase
      .from("board_columns")
      .update({ position: index * POSITION_GAP })
      .eq("id", id)
      .eq("idea_id", ideaId)
  );

  await Promise.all(updates);

  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function createBoardTask(
  ideaId: string,
  columnId: string,
  title: string,
  description?: string,
  assigneeId?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Get max position in this column
  const { data: tasks } = await supabase
    .from("board_tasks")
    .select("position")
    .eq("column_id", columnId)
    .order("position", { ascending: false })
    .limit(1);

  const maxPos = tasks && tasks.length > 0 ? tasks[0].position : -POSITION_GAP;

  const { error } = await supabase.from("board_tasks").insert({
    idea_id: ideaId,
    column_id: columnId,
    title,
    description: description || null,
    assignee_id: assigneeId || null,
    position: maxPos + POSITION_GAP,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function updateBoardTask(
  taskId: string,
  ideaId: string,
  updates: {
    title?: string;
    description?: string | null;
    assignee_id?: string | null;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("board_tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("idea_id", ideaId);

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function deleteBoardTask(taskId: string, ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("board_tasks")
    .delete()
    .eq("id", taskId)
    .eq("idea_id", ideaId);

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/board`);
}

export async function moveBoardTask(
  taskId: string,
  ideaId: string,
  newColumnId: string,
  newPosition: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("board_tasks")
    .update({ column_id: newColumnId, position: newPosition })
    .eq("id", taskId)
    .eq("idea_id", ideaId);

  if (error) throw new Error(error.message);

  revalidatePath(`/ideas/${ideaId}/board`);
}
