"use server";

import { createClient } from "@/lib/supabase/server";
import type { AiPromptTemplate } from "@/types";

export async function listPromptTemplates(
  type: "enhance" | "generate"
): Promise<AiPromptTemplate[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("ai_prompt_templates")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", type)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as AiPromptTemplate[];
}

export async function createPromptTemplate(
  name: string,
  promptText: string,
  type: "enhance" | "generate"
): Promise<AiPromptTemplate> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const trimmedName = name.trim();
  const trimmedPrompt = promptText.trim();

  if (!trimmedName) throw new Error("Template name is required");
  if (trimmedName.length > 100) throw new Error("Template name must be under 100 characters");
  if (!trimmedPrompt) throw new Error("Prompt text is required");
  if (trimmedPrompt.length > 5000) throw new Error("Prompt must be under 5000 characters");

  const { data, error } = await supabase
    .from("ai_prompt_templates")
    .insert({
      user_id: user.id,
      name: trimmedName,
      prompt_text: trimmedPrompt,
      type,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as AiPromptTemplate;
}

export async function deletePromptTemplate(templateId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("ai_prompt_templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}
