"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  validateTitle,
  validateOptionalDescription,
  validateBio,
  MAX_TAGS,
  MAX_TAG_LENGTH,
  ValidationError,
} from "@/lib/validation";

export async function completeOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase
    .from("users")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createIdeaFromOnboarding(data: {
  title: string;
  description?: string;
  tags: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const title = validateTitle(data.title);
  const description = data.description?.trim()
    ? validateOptionalDescription(data.description)
    : null;

  // Validate tags
  if (data.tags.length > MAX_TAGS) {
    throw new ValidationError(`Maximum ${MAX_TAGS} tags allowed`);
  }
  for (const tag of data.tags) {
    if (tag.length > MAX_TAG_LENGTH) {
      throw new ValidationError(
        `Tag "${tag}" exceeds ${MAX_TAG_LENGTH} characters`
      );
    }
  }

  const { data: idea, error } = await supabase
    .from("ideas")
    .insert({
      title,
      description: description || title,
      author_id: user.id,
      tags: data.tags,
      visibility: "public" as const,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { ideaId: idea.id };
}

export async function updateProfileFromOnboarding(data: {
  full_name?: string;
  bio?: string;
  github_username?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const updates: Record<string, unknown> = {};

  if (data.full_name !== undefined) {
    updates.full_name = data.full_name.trim() || null;
  }

  if (data.bio !== undefined) {
    updates.bio = validateBio(data.bio || null);
  }

  if (data.github_username !== undefined) {
    updates.github_username = data.github_username.trim() || null;
  }

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }
}
