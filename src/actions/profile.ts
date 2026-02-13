"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateBio, validateAvatarUrl } from "@/lib/validation";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const fullName = (formData.get("full_name") as string)?.trim() || null;
  const bio = validateBio((formData.get("bio") as string) || null);
  const githubUsername = (formData.get("github_username") as string)?.trim() || null;
  const contactInfo = (formData.get("contact_info") as string)?.trim() || null;

  const updates: Record<string, unknown> = {
    full_name: fullName,
    bio,
    github_username: githubUsername,
    contact_info: contactInfo,
  };

  if (formData.has("avatar_url")) {
    updates.avatar_url = validateAvatarUrl(
      (formData.get("avatar_url") as string) || null
    );
  }

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/profile/${user.id}`);
}

export async function updateDefaultBoardColumns(
  columns: { title: string; is_done_column: boolean }[] | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Validate: at least 1 column, max 10, at least 1 done column if set
  if (columns !== null) {
    if (columns.length === 0) throw new Error("At least one column is required");
    if (columns.length > 10) throw new Error("Maximum 10 columns allowed");
    if (!columns.some((c) => c.is_done_column)) {
      throw new Error("At least one column must be marked as done");
    }
    for (const col of columns) {
      if (!col.title.trim()) throw new Error("Column titles cannot be empty");
      if (col.title.length > 100) throw new Error("Column titles must be under 100 characters");
    }
  }

  const { error } = await supabase
    .from("users")
    .update({ default_board_columns: columns })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/profile/${user.id}`);
}
