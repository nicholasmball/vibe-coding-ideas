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
