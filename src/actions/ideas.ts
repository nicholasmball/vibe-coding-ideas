"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { IdeaStatus } from "@/types";

export async function createIdea(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const tagsRaw = formData.get("tags") as string;
  const githubUrl = (formData.get("github_url") as string) || null;

  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const { data, error } = await supabase
    .from("ideas")
    .insert({
      title,
      description,
      author_id: user.id,
      tags,
      github_url: githubUrl,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/ideas/${data.id}`);
}

export async function updateIdea(ideaId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const tagsRaw = formData.get("tags") as string;
  const githubUrl = (formData.get("github_url") as string) || null;

  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const { error } = await supabase
    .from("ideas")
    .update({ title, description, tags, github_url: githubUrl })
    .eq("id", ideaId)
    .eq("author_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/ideas/${ideaId}`);
}

export async function updateIdeaStatus(ideaId: string, status: IdeaStatus) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("ideas")
    .update({ status })
    .eq("id", ideaId)
    .eq("author_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/ideas/${ideaId}`);
}

export async function deleteIdea(ideaId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.is_admin ?? false;

  let query = supabase.from("ideas").delete().eq("id", ideaId);

  // Non-admins can only delete their own ideas
  if (!isAdmin) {
    query = query.eq("author_id", user.id);
  }

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  redirect("/feed");
}
