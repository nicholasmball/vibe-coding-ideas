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

/** Create an Anthropic provider using the user's key if available, else platform key. */
export function getAnthropicProvider(encryptedKey: string | null) {
  let apiKey = process.env.ANTHROPIC_API_KEY;
  if (encryptedKey) {
    try {
      apiKey = decrypt(encryptedKey);
    } catch {
      // Fall back to platform key if decryption fails
    }
  }
  if (!apiKey) {
    throw new Error("No API key available — add your own key in your profile settings");
  }
  return createAnthropic({ apiKey });
}

export function getKeyType(encryptedKey: string | null): "platform" | "byok" {
  if (!encryptedKey) return "platform";
  try {
    decrypt(encryptedKey);
    return "byok";
  } catch {
    return "platform";
  }
}

export async function checkRateLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
  profile: { encrypted_anthropic_key: string | null; ai_daily_limit: number }
): Promise<{ allowed: boolean; used: number; limit: number | null }> {
  const keyType = getKeyType(profile.encrypted_anthropic_key);

  // BYOK users are exempt from rate limits
  if (keyType === "byok") {
    return { allowed: true, used: 0, limit: null };
  }

  const limit = profile.ai_daily_limit;

  // Count today's platform usage
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("ai_usage_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("key_type", "platform")
    .gte("created_at", todayUTC.toISOString());

  const used = count ?? 0;
  return { allowed: used < limit, used, limit };
}

/** Check whether the platform has a shared Anthropic API key configured. */
export function hasPlatformKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function logAiUsage(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    actionType: AiActionType;
    inputTokens: number;
    outputTokens: number;
    model: string;
    keyType: "platform" | "byok";
    ideaId: string | null;
  }
) {
  await supabase.from("ai_usage_log").insert({
    user_id: params.userId,
    action_type: params.actionType,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    model: params.model,
    key_type: params.keyType,
    idea_id: params.ideaId,
  });
}
