import { z } from "zod";
import type { McpContext } from "../context";

// --- Add Collaborator ---

export const addCollaboratorSchema = z.object({
  idea_id: z.string().uuid().describe("The idea ID"),
  user_id: z.string().uuid().describe("The user ID to add as collaborator"),
});

export async function addCollaborator(
  ctx: McpContext,
  params: z.infer<typeof addCollaboratorSchema>
) {
  const { error } = await ctx.supabase.from("collaborators").insert({
    idea_id: params.idea_id,
    user_id: params.user_id,
  });

  // Ignore unique constraint violation (already a collaborator)
  if (error && error.code !== "23505") {
    throw new Error(`Failed to add collaborator: ${error.message}`);
  }

  return { success: true, idea_id: params.idea_id, user_id: params.user_id };
}

// --- Remove Collaborator ---

export const removeCollaboratorSchema = z.object({
  idea_id: z.string().uuid().describe("The idea ID"),
  user_id: z.string().uuid().describe("The user ID to remove as collaborator"),
});

export async function removeCollaborator(
  ctx: McpContext,
  params: z.infer<typeof removeCollaboratorSchema>
) {
  const { error } = await ctx.supabase
    .from("collaborators")
    .delete()
    .eq("idea_id", params.idea_id)
    .eq("user_id", params.user_id);

  if (error) throw new Error(`Failed to remove collaborator: ${error.message}`);
  return { success: true, idea_id: params.idea_id, user_id: params.user_id };
}

// --- List Collaborators ---

export const listCollaboratorsSchema = z.object({
  idea_id: z.string().uuid().describe("The idea ID"),
});

export async function listCollaborators(
  ctx: McpContext,
  params: z.infer<typeof listCollaboratorsSchema>
) {
  const { data, error } = await ctx.supabase
    .from("collaborators")
    .select("user_id, created_at, users!collaborators_user_id_fkey(id, full_name, email)")
    .eq("idea_id", params.idea_id);

  if (error) throw new Error(`Failed to list collaborators: ${error.message}`);

  return (data ?? []).map((c) => ({
    ...(c as Record<string, unknown>).users as object,
    joined_at: c.created_at,
  }));
}
