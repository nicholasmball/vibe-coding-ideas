"use server";

import { createClient } from "@/lib/supabase/server";

type FeedbackCategory = "bug" | "suggestion" | "question" | "other";

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
