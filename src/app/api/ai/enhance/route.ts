import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import {
  AI_MODEL,
  getAnthropicProvider,
  getPlatformAnthropicProvider,
  logAiUsage,
  decrementStarterCredit,
  PLATFORM_AI_DAILY_LIMIT,
  getPlatformAiCallsToday,
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
      .select("encrypted_anthropic_key, ai_starter_credits")
      .eq("id", user.id)
      .single();

    // Determine key type: BYOK → platform with credits → 403
    let keyType: "byok" | "platform";
    let anthropic;

    if (profile?.encrypted_anthropic_key) {
      keyType = "byok";
      anthropic = getAnthropicProvider(profile.encrypted_anthropic_key);
    } else if ((profile?.ai_starter_credits ?? 0) > 0) {
      keyType = "platform";
      if (PLATFORM_AI_DAILY_LIMIT > 0) {
        const todayCount = await getPlatformAiCallsToday(supabase, user.id);
        if (todayCount >= PLATFORM_AI_DAILY_LIMIT) {
          return Response.json(
            { error: "Daily AI safety limit reached. Please try again tomorrow." },
            { status: 429 }
          );
        }
      }
      anthropic = getPlatformAnthropicProvider();
    } else {
      return Response.json(
        { error: "You've used all your free AI credits. Add your API key in profile settings for unlimited use." },
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
      maxOutputTokens: 16000,
      onFinish: async ({ usage, finishReason }) => {
        await logAiUsage(supabase, {
          userId: user.id,
          actionType: "enhance_with_context",
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          model: AI_MODEL,
          ideaId,
          keyType,
        });
        if (keyType === "platform") {
          await decrementStarterCredit(supabase, user.id);
        }
        if (finishReason === "length") {
          console.warn(`[AI Enhance] Output truncated for idea ${ideaId}`);
        }
      },
    });

    // Stream text, then append a truncation sentinel if output was cut short
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.textStream) {
          controller.enqueue(encoder.encode(chunk));
        }
        const reason = await result.finishReason;
        if (reason === "length") {
          controller.enqueue(encoder.encode("\n\n__TRUNCATED__"));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("[AI Enhance API Error]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
