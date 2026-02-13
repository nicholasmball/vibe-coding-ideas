import { z } from "zod";
import type { McpContext } from "../context";

// --- Update Profile ---

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .max(200)
    .optional()
    .describe("Display name"),
  bio: z
    .string()
    .max(500)
    .optional()
    .describe("Short bio"),
  github_username: z
    .string()
    .max(100)
    .optional()
    .describe("GitHub username (without @)"),
  avatar_url: z
    .string()
    .url()
    .max(2000)
    .optional()
    .describe("Avatar image URL"),
  contact_info: z
    .string()
    .max(500)
    .optional()
    .describe("Contact information"),
});

export async function updateProfile(
  ctx: McpContext,
  params: z.infer<typeof updateProfileSchema>
) {
  const updates: Record<string, unknown> = {};

  if (params.full_name !== undefined) updates.full_name = params.full_name || null;
  if (params.bio !== undefined) updates.bio = params.bio || null;
  if (params.github_username !== undefined) updates.github_username = params.github_username || null;
  if (params.avatar_url !== undefined) updates.avatar_url = params.avatar_url || null;
  if (params.contact_info !== undefined) updates.contact_info = params.contact_info || null;

  if (Object.keys(updates).length === 0) {
    return { success: true, message: "No changes to apply" };
  }

  const { data, error } = await ctx.supabase
    .from("users")
    .update(updates)
    .eq("id", ctx.userId)
    .select("id, full_name, bio, github_username, avatar_url, contact_info")
    .single();

  if (error) throw new Error(`Failed to update profile: ${error.message}`);
  return { success: true, profile: data };
}
