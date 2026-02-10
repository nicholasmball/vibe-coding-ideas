"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateBio } from "@/lib/validation";

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

  const { error } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      bio,
      github_username: githubUsername,
      contact_info: contactInfo,
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/profile/${user.id}`);
}
