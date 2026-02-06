"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const fullName = formData.get("full_name") as string;
  const bio = formData.get("bio") as string;
  const githubUsername = formData.get("github_username") as string;

  const { error } = await supabase
    .from("users")
    .update({
      full_name: fullName || null,
      bio: bio || null,
      github_username: githubUsername || null,
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/profile/${user.id}`);
}
