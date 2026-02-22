"use server";

import { createClient } from "@/lib/supabase/server";
import { generateText, generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { decrypt } from "@/lib/encryption";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AiCredits } from "@/types";

const AI_MODEL = "claude-sonnet-4-5-20250929";

type ActionType = "enhance_description" | "generate_questions" | "enhance_with_context" | "generate_board_tasks" | "enhance_task_description";

// ── Helpers ──────────────────────────────────────────────────────────────

/** Create an Anthropic provider using the user's key if available, else platform key. */
function getAnthropicProvider(encryptedKey: string | null) {
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

function getKeyType(encryptedKey: string | null): "platform" | "byok" {
  if (!encryptedKey) return "platform";
  try {
    decrypt(encryptedKey);
    return "byok";
  } catch {
    return "platform";
  }
}

async function checkRateLimit(
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

async function logAiUsage(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    actionType: ActionType;
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

// ── Get Remaining Credits ────────────────────────────────────────────────

export async function getAiRemainingCredits(): Promise<AiCredits> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { used: 0, limit: null, remaining: null, isByok: false };

  const { data: profile } = await supabase
    .from("users")
    .select("encrypted_anthropic_key, ai_daily_limit")
    .eq("id", user.id)
    .single();

  if (!profile) return { used: 0, limit: null, remaining: null, isByok: false };

  const isByok = getKeyType(profile.encrypted_anthropic_key) === "byok";

  if (isByok) {
    return { used: 0, limit: null, remaining: null, isByok: true };
  }

  const limit = profile.ai_daily_limit;

  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("ai_usage_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("key_type", "platform")
    .gte("created_at", todayUTC.toISOString());

  const used = count ?? 0;
  return { used, limit, remaining: Math.max(0, limit - used), isByok: false };
}

// ── Enhance Idea Description ───────────────────────────────────────────

export async function enhanceIdeaDescription(
  ideaId: string,
  prompt: string,
  personaPrompt?: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("users")
    .select("ai_enabled, encrypted_anthropic_key, ai_daily_limit")
    .eq("id", user.id)
    .single();

  if (!profile?.ai_enabled) {
    throw new Error("AI features are not enabled for your account");
  }

  const keyType = getKeyType(profile.encrypted_anthropic_key);
  const rateCheck = await checkRateLimit(supabase, user.id, profile);
  if (!rateCheck.allowed) {
    throw new Error(`Daily AI limit reached (${rateCheck.used}/${rateCheck.limit}). Try again tomorrow.`);
  }

  const anthropic = getAnthropicProvider(profile.encrypted_anthropic_key);

  const { data: idea } = await supabase
    .from("ideas")
    .select("id, title, description, author_id")
    .eq("id", ideaId)
    .single();

  if (!idea) throw new Error("Idea not found");
  if (idea.author_id !== user.id) {
    throw new Error("Only the idea author can enhance the description");
  }

  const systemPrompt = personaPrompt
    ? `${personaPrompt}\n\nYou are helping to enhance an idea description on a project management platform.`
    : "You are an expert product manager and technical writer helping to enhance idea descriptions on a project management platform.";

  const { text, usage, finishReason } = await generateText({
    model: anthropic(AI_MODEL),
    system: systemPrompt,
    prompt: `${prompt}\n\n---\n\n**Idea Title:** ${idea.title}\n\n**Current Description:**\n${idea.description}`,
    maxOutputTokens: 8000,
  });

  await logAiUsage(supabase, {
    userId: user.id,
    actionType: "enhance_description",
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    model: AI_MODEL,
    keyType,
    ideaId,
  });

  return { enhanced: text, original: idea.description, truncated: finishReason === "length" };
}

// ── Generate Clarifying Questions ───────────────────────────────────────

const ClarifyingQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      placeholder: z.string().optional(),
    })
  ),
});

export type ClarifyingQuestion = z.infer<typeof ClarifyingQuestionsSchema>["questions"][number];

export async function generateClarifyingQuestions(
  ideaId: string,
  prompt: string,
  personaPrompt?: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("users")
    .select("ai_enabled, encrypted_anthropic_key, ai_daily_limit")
    .eq("id", user.id)
    .single();

  if (!profile?.ai_enabled) {
    throw new Error("AI features are not enabled for your account");
  }

  const keyType = getKeyType(profile.encrypted_anthropic_key);
  const rateCheck = await checkRateLimit(supabase, user.id, profile);
  if (!rateCheck.allowed) {
    throw new Error(`Daily AI limit reached (${rateCheck.used}/${rateCheck.limit}). Try again tomorrow.`);
  }

  const anthropic = getAnthropicProvider(profile.encrypted_anthropic_key);

  const { data: idea } = await supabase
    .from("ideas")
    .select("id, title, description, author_id")
    .eq("id", ideaId)
    .single();

  if (!idea) throw new Error("Idea not found");
  if (idea.author_id !== user.id) {
    throw new Error("Only the idea author can enhance the description");
  }

  const systemPrompt = personaPrompt
    ? `${personaPrompt}\n\nYou are helping to enhance an idea description. Before enhancing, you need to ask 2-4 focused clarifying questions to produce a better result.`
    : "You are an expert product manager helping to enhance an idea description. Before enhancing, you need to ask 2-4 focused clarifying questions to produce a better result.";

  const { object, usage } = await generateObject({
    model: anthropic(AI_MODEL),
    system: systemPrompt,
    prompt: `The user wants to enhance the following idea. Read the idea and the user's enhancement prompt, then generate 2-4 targeted clarifying questions that would help you produce a much better enhancement. Focus on questions about target users, technical scope, project goals, success criteria, or any gaps in the current description.

**Enhancement Prompt:** ${prompt}

---

**Idea Title:** ${idea.title}

**Current Description:**
${idea.description}`,
    schema: ClarifyingQuestionsSchema,
    maxOutputTokens: 1000,
  });

  await logAiUsage(supabase, {
    userId: user.id,
    actionType: "generate_questions",
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    model: AI_MODEL,
    keyType,
    ideaId,
  });

  return { questions: object.questions };
}

// ── Enhance Idea with Context (Multi-Turn) ──────────────────────────────

export async function enhanceIdeaWithContext(
  ideaId: string,
  prompt: string,
  options?: {
    personaPrompt?: string | null;
    answers?: Record<string, { question: string; answer: string }>;
    previousEnhanced?: string;
    refinementFeedback?: string;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("users")
    .select("ai_enabled, encrypted_anthropic_key, ai_daily_limit")
    .eq("id", user.id)
    .single();

  if (!profile?.ai_enabled) {
    throw new Error("AI features are not enabled for your account");
  }

  const keyType = getKeyType(profile.encrypted_anthropic_key);
  const rateCheck = await checkRateLimit(supabase, user.id, profile);
  if (!rateCheck.allowed) {
    throw new Error(`Daily AI limit reached (${rateCheck.used}/${rateCheck.limit}). Try again tomorrow.`);
  }

  const anthropic = getAnthropicProvider(profile.encrypted_anthropic_key);

  const { data: idea } = await supabase
    .from("ideas")
    .select("id, title, description, author_id")
    .eq("id", ideaId)
    .single();

  if (!idea) throw new Error("Idea not found");
  if (idea.author_id !== user.id) {
    throw new Error("Only the idea author can enhance the description");
  }

  const personaPrompt = options?.personaPrompt;
  const isRefinement = options?.previousEnhanced && options?.refinementFeedback;

  const systemPrompt = personaPrompt
    ? `${personaPrompt}\n\nYou are helping to enhance an idea description on a project management platform.`
    : "You are an expert product manager and technical writer helping to enhance idea descriptions on a project management platform.";

  let userPrompt: string;

  if (isRefinement) {
    userPrompt = `You previously enhanced an idea description. The user has feedback for revision.

**Original Description:**
${idea.description}

**Your Previous Enhancement:**
${options!.previousEnhanced}

**User's Refinement Feedback:**
${options!.refinementFeedback}

Revise the enhanced description based on this feedback. Keep changes targeted to what was requested.`;
  } else if (options?.answers && Object.keys(options.answers).length > 0) {
    const qaSection = Object.values(options.answers)
      .map((a, i) => `${i + 1}. Q: ${a.question}\n   A: ${a.answer}`)
      .join("\n\n");

    userPrompt = `${prompt}

---
**Idea Title:** ${idea.title}
**Current Description:**
${idea.description}

---
**Clarifying Q&A:**
${qaSection}

Use the answers above to inform your enhanced description. Make the enhancement specific and tailored based on what you learned.`;
  } else {
    userPrompt = `${prompt}\n\n---\n\n**Idea Title:** ${idea.title}\n\n**Current Description:**\n${idea.description}`;
  }

  const { text, usage, finishReason } = await generateText({
    model: anthropic(AI_MODEL),
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: 8000,
  });

  await logAiUsage(supabase, {
    userId: user.id,
    actionType: "enhance_with_context",
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    model: AI_MODEL,
    keyType,
    ideaId,
  });

  return { enhanced: text, original: idea.description, truncated: finishReason === "length" };
}

// ── Apply Enhanced Description ──────────────────────────────────────────

export async function applyEnhancedDescription(
  ideaId: string,
  description: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("ideas")
    .update({ description })
    .eq("id", ideaId)
    .eq("author_id", user.id);

  if (error) throw new Error(error.message);
}

// ── Generate Board Tasks ────────────────────────────────────────────────

const GeneratedTaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  columnName: z.string().optional(),
  labels: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
});

const GeneratedBoardSchema = z.object({
  tasks: z.array(GeneratedTaskSchema),
});

export async function generateBoardTasks(
  ideaId: string,
  prompt: string,
  personaPrompt?: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("users")
    .select("ai_enabled, encrypted_anthropic_key, ai_daily_limit")
    .eq("id", user.id)
    .single();

  if (!profile?.ai_enabled) {
    throw new Error("AI features are not enabled for your account");
  }

  const keyType = getKeyType(profile.encrypted_anthropic_key);
  const rateCheck = await checkRateLimit(supabase, user.id, profile);
  if (!rateCheck.allowed) {
    throw new Error(`Daily AI limit reached (${rateCheck.used}/${rateCheck.limit}). Try again tomorrow.`);
  }

  const anthropic = getAnthropicProvider(profile.encrypted_anthropic_key);

  const { data: idea } = await supabase
    .from("ideas")
    .select("id, title, description, author_id")
    .eq("id", ideaId)
    .single();

  if (!idea) throw new Error("Idea not found");

  const isAuthor = idea.author_id === user.id;
  if (!isAuthor) {
    const { data: collab } = await supabase
      .from("collaborators")
      .select("id")
      .eq("idea_id", ideaId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!collab) {
      throw new Error("Only team members can generate board tasks");
    }
  }

  // Fetch existing board state for context
  const { data: columns } = await supabase
    .from("board_columns")
    .select("title")
    .eq("idea_id", ideaId)
    .order("position");

  const existingColumns = (columns ?? []).map((c) => c.title);

  const systemPrompt = personaPrompt
    ? `${personaPrompt}\n\nYou are generating a structured task board for a software project on a kanban-style project management platform. If a task has subtasks or implementation steps, include them as a markdown checklist in the description (e.g. "- [ ] Step one\\n- [ ] Step two").`
    : "You are an expert project manager generating a structured task board for a software project on a kanban-style project management platform. If a task has subtasks or implementation steps, include them as a markdown checklist in the description (e.g. \"- [ ] Step one\\n- [ ] Step two\").";

  const contextParts = [
    `${prompt}`,
    `---`,
    `**Idea Title:** ${idea.title}`,
    `**Idea Description:**\n${idea.description}`,
  ];

  if (existingColumns.length > 0) {
    contextParts.push(
      `**Existing Board Columns:** ${existingColumns.join(", ")}`,
      `Use existing column names where appropriate, or suggest new ones if needed.`
    );
  }

  const { object, usage } = await generateObject({
    model: anthropic(AI_MODEL),
    system: systemPrompt,
    prompt: contextParts.join("\n\n"),
    schema: GeneratedBoardSchema,
    maxOutputTokens: 8000,
  });

  await logAiUsage(supabase, {
    userId: user.id,
    actionType: "generate_board_tasks",
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    model: AI_MODEL,
    keyType,
    ideaId,
  });

  // Cap at 50 tasks (Anthropic API doesn't support maxItems in schema)
  const tasks = object.tasks.slice(0, 50);

  return {
    tasks,
    count: tasks.length,
  };
}

// ── Enhance Task Description ─────────────────────────────────────────────

export async function enhanceTaskDescription(
  ideaId: string,
  taskTitle: string,
  taskDescription: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("users")
    .select("ai_enabled, encrypted_anthropic_key, ai_daily_limit")
    .eq("id", user.id)
    .single();

  if (!profile?.ai_enabled) {
    throw new Error("AI features are not enabled for your account");
  }

  const keyType = getKeyType(profile.encrypted_anthropic_key);
  const rateCheck = await checkRateLimit(supabase, user.id, profile);
  if (!rateCheck.allowed) {
    throw new Error(`Daily AI limit reached (${rateCheck.used}/${rateCheck.limit}). Try again tomorrow.`);
  }

  const anthropic = getAnthropicProvider(profile.encrypted_anthropic_key);

  const { data: idea } = await supabase
    .from("ideas")
    .select("id, title, description")
    .eq("id", ideaId)
    .single();

  if (!idea) throw new Error("Idea not found");

  const { text, usage } = await generateText({
    model: anthropic(AI_MODEL),
    system: "You are a concise technical writer. Improve the task description's clarity and structure. STRICT RULES: Keep the output roughly the same length as the input (never more than 2x). Do NOT add boilerplate sections, templates, checklists, or context the user didn't provide. Just sharpen what's already there. Return ONLY the improved description — no preamble.",
    prompt: `**Task Title:** ${taskTitle}
**Current Description:**
${taskDescription}

**Context (for reference only, do NOT repeat in output):** Project "${idea.title}"`,
    maxOutputTokens: 1000,
  });

  await logAiUsage(supabase, {
    userId: user.id,
    actionType: "enhance_task_description",
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    model: AI_MODEL,
    keyType,
    ideaId,
  });

  return { enhanced: text };
}
