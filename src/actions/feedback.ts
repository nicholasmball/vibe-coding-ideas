"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type FeedbackCategory = "bug" | "suggestion" | "question" | "other";
type FeedbackStatus = "new" | "reviewed" | "archived";

export async function submitFeedback(
  category: FeedbackCategory,
  content: string,
  pageUrl: string | null
) {
  const trimmed = content.trim();
  if (!trimmed) throw new Error("Feedback content is required");
  if (trimmed.length > 5000) throw new Error("Feedback is too long (max 5000 characters)");

  const validCategories: FeedbackCategory[] = ["bug", "suggestion", "question", "other"];
  if (!validCategories.includes(category)) throw new Error("Invalid category");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    category,
    content: trimmed,
    page_url: pageUrl,
  });

  if (error) throw new Error(error.message);
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!data?.is_admin) throw new Error("Not authorized");
  return supabase;
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus) {
  const validStatuses: FeedbackStatus[] = ["new", "reviewed", "archived"];
  if (!validStatuses.includes(status)) throw new Error("Invalid status");

  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("feedback")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function deleteFeedback(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("feedback")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
