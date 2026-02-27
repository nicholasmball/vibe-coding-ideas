import { createAnthropic } from "@ai-sdk/anthropic";
import { decrypt } from "@/lib/encryption";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const AI_MODEL = "claude-sonnet-4-6";

export type AiActionType =
  | "enhance_description"
  | "generate_questions"
  | "enhance_with_context"
  | "generate_board_tasks"
  | "enhance_task_description";

/** Create an Anthropic provider using the user's BYOK key. */
export function getAnthropicProvider(encryptedKey: string | null) {
  if (!encryptedKey) {
    throw new Error("No API key configured — add your Anthropic key in your profile settings");
  }
  let apiKey: string;
  try {
    apiKey = decrypt(encryptedKey);
  } catch {
    throw new Error("Failed to decrypt API key — please re-save your key in profile settings");
  }
  return createAnthropic({ apiKey });
}

export async function logAiUsage(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    actionType: AiActionType;
    inputTokens: number;
    outputTokens: number;
    model: string;
    ideaId: string | null;
    keyType?: "platform" | "byok";
  }
) {
  await supabase.from("ai_usage_log").insert({
    user_id: params.userId,
    action_type: params.actionType,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    model: params.model,
    key_type: params.keyType ?? "byok",
    idea_id: params.ideaId,
  });
}
