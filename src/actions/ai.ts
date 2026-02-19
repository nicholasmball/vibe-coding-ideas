"use server";

import { createClient } from "@/lib/supabase/server";
import { generateText, generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { decrypt } from "@/lib/encryption";
import { z } from "zod";

const AI_MODEL = "claude-sonnet-4-5-20250929";

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

  // Check ai_enabled and get user's API key
  const { data: profile } = await supabase
    .from("users")
    .select("ai_enabled, encrypted_anthropic_key")
    .eq("id", user.id)
    .single();

  if (!profile?.ai_enabled) {
    throw new Error("AI features are not enabled for your account");
  }

  const anthropic = getAnthropicProvider(profile.encrypted_anthropic_key);

  // Check ownership
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

  const { text } = await generateText({
    model: anthropic(AI_MODEL),
    system: systemPrompt,
    prompt: `${prompt}\n\n---\n\n**Idea Title:** ${idea.title}\n\n**Current Description:**\n${idea.description}`,
    maxOutputTokens: 4000,
  });

  return { enhanced: text, original: idea.description };
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
    .select("ai_enabled, encrypted_anthropic_key")
    .eq("id", user.id)
    .single();

  if (!profile?.ai_enabled) {
    throw new Error("AI features are not enabled for your account");
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

  const { object } = await generateObject({
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
    .select("ai_enabled, encrypted_anthropic_key")
    .eq("id", user.id)
    .single();

  if (!profile?.ai_enabled) {
    throw new Error("AI features are not enabled for your account");
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
    // Refinement path: revise previous enhancement based on feedback
    userPrompt = `You previously enhanced an idea description. The user has feedback for revision.

**Original Description:**
${idea.description}

**Your Previous Enhancement:**
${options!.previousEnhanced}

**User's Refinement Feedback:**
${options!.refinementFeedback}

Revise the enhanced description based on this feedback. Keep changes targeted to what was requested.`;
  } else if (options?.answers && Object.keys(options.answers).length > 0) {
    // Answers path: enhance with Q&A context
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
    // Skip path: same as legacy one-shot
    userPrompt = `${prompt}\n\n---\n\n**Idea Title:** ${idea.title}\n\n**Current Description:**\n${idea.description}`;
  }

  const { text } = await generateText({
    model: anthropic(AI_MODEL),
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: 4000,
  });

  return { enhanced: text, original: idea.description };
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
  checklistItems: z.array(z.string()).optional(),
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

  // Check ai_enabled and get user's API key
  const { data: profile } = await supabase
    .from("users")
    .select("ai_enabled, encrypted_anthropic_key")
    .eq("id", user.id)
    .single();

  if (!profile?.ai_enabled) {
    throw new Error("AI features are not enabled for your account");
  }

  const anthropic = getAnthropicProvider(profile.encrypted_anthropic_key);

  // Check team membership (author or collaborator)
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
    ? `${personaPrompt}\n\nYou are generating a structured task board for a software project on a kanban-style project management platform.`
    : "You are an expert project manager generating a structured task board for a software project on a kanban-style project management platform.";

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

  const { object } = await generateObject({
    model: anthropic(AI_MODEL),
    system: systemPrompt,
    prompt: contextParts.join("\n\n"),
    schema: GeneratedBoardSchema,
    maxOutputTokens: 8000,
  });

  // Cap at 50 tasks (Anthropic API doesn't support maxItems in schema)
  const tasks = object.tasks.slice(0, 50);

  return {
    tasks,
    count: tasks.length,
  };
}
