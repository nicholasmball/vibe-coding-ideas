import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import {
  AI_MODEL,
  getAnthropicProvider,
  logAiUsage,
} from "@/lib/ai-helpers";

export const maxDuration = 300; // Streaming keeps the connection alive; allow generous time

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("encrypted_anthropic_key")
      .eq("id", user.id)
      .single();

    if (!profile?.encrypted_anthropic_key) {
      return Response.json(
        { error: "No API key configured — add your Anthropic key in your profile settings" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { ideaId, prompt, personaPrompt, answers, previousEnhanced, refinementFeedback } = body as {
      ideaId: string;
      prompt: string;
      personaPrompt?: string | null;
      answers?: Record<string, { question: string; answer: string }>;
      previousEnhanced?: string;
      refinementFeedback?: string;
    };

    if (!ideaId || !prompt) {
      return Response.json({ error: "Missing ideaId or prompt" }, { status: 400 });
    }

    const anthropic = getAnthropicProvider(profile.encrypted_anthropic_key);

    const { data: idea } = await supabase
      .from("ideas")
      .select("id, title, description, author_id")
      .eq("id", ideaId)
      .single();

    if (!idea) {
      return Response.json({ error: "Idea not found" }, { status: 404 });
    }
    if (idea.author_id !== user.id) {
      return Response.json(
        { error: "Only the idea author can enhance the description" },
        { status: 403 }
      );
    }

    // Build prompts (same logic as enhanceIdeaWithContext server action)
    const isRefinement = previousEnhanced && refinementFeedback;

    const systemPrompt = personaPrompt
      ? `${personaPrompt}\n\nYou are helping to enhance an idea description on a project management platform.`
      : "You are an expert product manager and technical writer helping to enhance idea descriptions on a project management platform.";

    let userPrompt: string;

    if (isRefinement) {
      userPrompt = `You previously enhanced an idea description. The user has feedback for revision.

**Original Description:**
${idea.description}

**Your Previous Enhancement:**
${previousEnhanced}

**User's Refinement Feedback:**
${refinementFeedback}

Revise the enhanced description based on this feedback. Keep changes targeted to what was requested.`;
    } else if (answers && Object.keys(answers).length > 0) {
      const qaSection = Object.values(answers)
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

    const result = streamText({
      model: anthropic(AI_MODEL),
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 8000,
      onFinish: async ({ usage, finishReason }) => {
        await logAiUsage(supabase, {
          userId: user.id,
          actionType: "enhance_with_context",
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          model: AI_MODEL,
          ideaId,
        });
        // Log truncation for debugging
        if (finishReason === "length") {
          console.warn(`[AI Enhance] Output truncated for idea ${ideaId}`);
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[AI Enhance API Error]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
