"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Sparkles,
  ArrowLeft,
  MessageSquareMore,
  PenLine,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Markdown } from "@/components/ui/markdown";
import {
  enhanceIdeaDescription,
  applyEnhancedDescription,
  generateClarifyingQuestions,
  enhanceIdeaWithContext,
} from "@/actions/ai";
import { PromptTemplateSelector } from "@/components/ai/prompt-template-selector";
import { AiProgressSteps } from "@/components/ai/ai-progress-steps";
import type { ClarifyingQuestion } from "@/actions/ai";
import type { BotProfile, AiCredits } from "@/types";

const DEFAULT_PROMPT =
  "Improve this idea description. Add more detail, user stories, technical scope, and a clear product vision. Keep the original intent and key points, but make it more comprehensive and well-structured.";

type DialogPhase = "configure" | "questions" | "result" | "refine";

interface EnhanceIdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideaId: string;
  ideaTitle: string;
  currentDescription: string;
  bots: BotProfile[];
  aiCredits?: AiCredits | null;
}

export function EnhanceIdeaDialog({
  open,
  onOpenChange,
  ideaId,
  ideaTitle,
  currentDescription,
  bots,
  aiCredits,
}: EnhanceIdeaDialogProps) {
  const router = useRouter();

  // Phase state
  const [phase, setPhase] = useState<DialogPhase>("configure");

  // Configure phase
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [selectedBotId, setSelectedBotId] = useState<string>("default");
  const [askQuestions, setAskQuestions] = useState(true);

  // Questions phase
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  // Result phase
  const [enhancedText, setEnhancedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  // Refine phase
  const [refinementInput, setRefinementInput] = useState("");

  // Credit tracking
  const [localRemaining, setLocalRemaining] = useState<number | null>(
    aiCredits?.remaining ?? null
  );

  const busy = loading || applying || generatingQuestions;

  const questionSteps = [
    { title: "Reading your idea", description: "Analyzing the description and prompt" },
    { title: "Crafting targeted questions", description: "Identifying gaps to fill" },
    { title: "Preparing", description: "Finalizing questions" },
  ];

  const enhanceSteps = [
    { title: "Analyzing description", description: "Understanding your idea" },
    { title: "Enhancing content", description: "Writing improved version" },
    { title: "Polishing output", description: "Refining structure and detail" },
  ];

  const refineSteps = [
    { title: "Reading feedback", description: "Understanding your changes" },
    { title: "Revising content", description: "Applying your feedback" },
    { title: "Polishing", description: "Finalizing the revision" },
  ];
  const activeBots = bots.filter((b) => b.is_active);

  function getPersonaPrompt() {
    if (selectedBotId === "default") return null;
    return activeBots.find((b) => b.id === selectedBotId)?.system_prompt ?? null;
  }

  // ── Phase: Configure → Questions or Result ──────────────────────────

  async function handleNext() {
    if (askQuestions) {
      // Generate clarifying questions
      setGeneratingQuestions(true);
      try {
        const result = await generateClarifyingQuestions(
          ideaId,
          prompt,
          getPersonaPrompt()
        );
        if (localRemaining !== null) {
          setLocalRemaining((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
        }
        setQuestions(result.questions);
        setAnswers({});
        setPhase("questions");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to generate questions"
        );
      } finally {
        setGeneratingQuestions(false);
      }
    } else {
      // Legacy one-shot path
      await handleEnhanceLegacy();
    }
  }

  // Legacy one-shot enhance (no questions)
  async function handleEnhanceLegacy() {
    setLoading(true);
    try {
      const result = await enhanceIdeaDescription(
        ideaId,
        prompt,
        getPersonaPrompt()
      );
      if (localRemaining !== null) {
        setLocalRemaining((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
      }
      setEnhancedText(result.enhanced);
      setPhase("result");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to enhance description"
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Phase: Questions → Result ───────────────────────────────────────

  async function handleEnhanceWithAnswers() {
    setLoading(true);
    try {
      const answersPayload: Record<string, { question: string; answer: string }> = {};
      for (const q of questions) {
        const answer = (answers[q.id] ?? "").trim();
        if (answer) {
          answersPayload[q.id] = { question: q.question, answer };
        }
      }

      const result = await enhanceIdeaWithContext(ideaId, prompt, {
        personaPrompt: getPersonaPrompt(),
        answers: Object.keys(answersPayload).length > 0 ? answersPayload : undefined,
      });
      if (localRemaining !== null) {
        setLocalRemaining((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
      }
      setEnhancedText(result.enhanced);
      setPhase("result");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to enhance description"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSkipQuestions() {
    setLoading(true);
    try {
      const result = await enhanceIdeaWithContext(ideaId, prompt, {
        personaPrompt: getPersonaPrompt(),
      });
      if (localRemaining !== null) {
        setLocalRemaining((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
      }
      setEnhancedText(result.enhanced);
      setPhase("result");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to enhance description"
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Phase: Result → Apply or Refine ─────────────────────────────────

  async function handleApply() {
    if (!enhancedText) return;
    setApplying(true);
    try {
      await applyEnhancedDescription(ideaId, enhancedText);
      toast.success("Description updated with AI enhancement");
      onOpenChange(false);
      resetState();
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to apply enhancement"
      );
    } finally {
      setApplying(false);
    }
  }

  // ── Phase: Refine → Result ──────────────────────────────────────────

  async function handleRefine() {
    if (!enhancedText || !refinementInput.trim()) return;
    setLoading(true);
    try {
      const result = await enhanceIdeaWithContext(ideaId, prompt, {
        personaPrompt: getPersonaPrompt(),
        previousEnhanced: enhancedText,
        refinementFeedback: refinementInput.trim(),
      });
      if (localRemaining !== null) {
        setLocalRemaining((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
      }
      setEnhancedText(result.enhanced);
      setRefinementInput("");
      setPhase("result");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to refine description"
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Reset & Navigation ──────────────────────────────────────────────

  function resetState() {
    setPhase("configure");
    setPrompt(DEFAULT_PROMPT);
    setSelectedBotId("default");
    setAskQuestions(true);
    setQuestions([]);
    setAnswers({});
    setEnhancedText(null);
    setRefinementInput("");
    setLocalRemaining(aiCredits?.remaining ?? null);
  }

  function handleOpenChange(value: boolean) {
    if (busy) return;
    if (!value) resetState();
    onOpenChange(value);
  }

  // ── Phase descriptions ──────────────────────────────────────────────

  const phaseDescriptions: Record<DialogPhase, string> = {
    configure: "Configure how AI should enhance your idea description.",
    questions: "Answer a few questions to help AI understand your vision better.",
    result: "Compare the original and enhanced descriptions.",
    refine: "Tell the AI how to improve the enhancement.",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:max-w-2xl sm:p-6"
        onInteractOutside={(e) => busy && e.preventDefault()}
        onEscapeKeyDown={(e) => busy && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Enhance with AI
          </DialogTitle>
          <DialogDescription>{phaseDescriptions[phase]}</DialogDescription>
        </DialogHeader>

        {/* ── Configure Phase ────────────────────────────────────────── */}
        {phase === "configure" && (
          <div className="space-y-4">
            {aiCredits && !aiCredits.isByok && localRemaining !== null && (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                {localRemaining}/{aiCredits.limit} credits remaining today
              </div>
            )}
            {aiCredits?.isByok && (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Using your API key
              </div>
            )}
            <div className="grid">
              <div className={`col-start-1 row-start-1 ${generatingQuestions || loading ? "pointer-events-none opacity-40 blur-[1px]" : ""} transition-all`}>
                {/* Persona selector */}
                {activeBots.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <Label>AI Persona</Label>
                    <Select
                      value={selectedBotId}
                      onValueChange={setSelectedBotId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select persona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">
                          Default (Product Manager)
                        </SelectItem>
                        {activeBots.map((bot) => (
                          <SelectItem key={bot.id} value={bot.id}>
                            {bot.name}
                            {bot.role ? ` (${bot.role})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Prompt */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <Label>Prompt</Label>
                    <PromptTemplateSelector
                      type="enhance"
                      currentPrompt={prompt}
                      onSelectTemplate={setPrompt}
                      disabled={busy}
                    />
                  </div>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    placeholder="Tell the AI how to enhance this description..."
                    disabled={busy}
                  />
                </div>

                {/* Ask questions checkbox */}
                <div className="mb-4 flex items-center gap-2">
                  <Checkbox
                    id="ask-questions"
                    checked={askQuestions}
                    onCheckedChange={(checked) =>
                      setAskQuestions(checked === true)
                    }
                    disabled={busy}
                  />
                  <Label
                    htmlFor="ask-questions"
                    className="cursor-pointer text-sm font-normal"
                  >
                    Ask clarifying questions first (recommended)
                  </Label>
                </div>

                {/* Current description preview */}
                <div className="min-w-0 space-y-2">
                  <Label className="text-muted-foreground">
                    Current Description
                  </Label>
                  <div className="max-h-40 overflow-y-auto overflow-x-hidden rounded-md border border-border bg-muted/30 p-3 text-sm break-words">
                    <Markdown>{currentDescription}</Markdown>
                  </div>
                </div>
              </div>

              {(generatingQuestions || loading) && (
                <div className="col-start-1 row-start-1 z-10 flex items-center justify-center">
                  <AiProgressSteps
                    steps={generatingQuestions ? questionSteps : enhanceSteps}
                    advanceAt={generatingQuestions ? [8, 20] : [10, 30]}
                    active={generatingQuestions || loading}
                  />
                </div>
              )}
            </div>

            {!generatingQuestions && !loading && (
              <Button
                onClick={handleNext}
                disabled={!prompt.trim() || (!aiCredits?.isByok && localRemaining === 0)}
                className="w-full gap-2"
              >
                {askQuestions ? (
                  <>
                    <MessageSquareMore className="h-4 w-4" />
                    Next
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Enhance
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* ── Questions Phase ────────────────────────────────────────── */}
        {phase === "questions" && (
          <div className="space-y-4">
            <div className="grid">
              <div className={`col-start-1 row-start-1 ${loading ? "pointer-events-none opacity-40 blur-[1px]" : ""} transition-all`}>
                <div className="space-y-4">
                  {questions.map((q, i) => (
                    <div key={q.id} className="space-y-1.5">
                      <Label className="text-sm">
                        {i + 1}. {q.question}
                      </Label>
                      <Textarea
                        value={answers[q.id] ?? ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        placeholder={q.placeholder ?? "Your answer..."}
                        rows={2}
                        disabled={busy}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {loading && (
                <div className="col-start-1 row-start-1 z-10 flex items-center justify-center">
                  <AiProgressSteps
                    steps={enhanceSteps}
                    advanceAt={[10, 30]}
                    active={loading}
                  />
                </div>
              )}
            </div>

            {!loading && (
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleEnhanceWithAnswers}
                  disabled={busy}
                  className="min-w-[140px] flex-1 gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Enhance with Answers
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSkipQuestions}
                  disabled={busy}
                  className="gap-2"
                >
                  Skip
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setPhase("configure")}
                  disabled={busy}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Result Phase ───────────────────────────────────────────── */}
        {phase === "result" && enhancedText && (
          <div className="space-y-4">
            {/* Side-by-side comparison */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <Label className="text-muted-foreground">Original</Label>
                <div className="max-h-60 overflow-y-auto overflow-x-hidden rounded-md border border-border bg-muted/30 p-3 text-sm break-words">
                  <Markdown>{currentDescription}</Markdown>
                </div>
              </div>
              <div className="min-w-0 space-y-2">
                <Label className="text-primary">Enhanced</Label>
                <div className="max-h-60 overflow-y-auto overflow-x-hidden rounded-md border border-primary/30 bg-primary/5 p-3 text-sm break-words">
                  <Markdown>{enhancedText}</Markdown>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleApply}
                disabled={busy}
                className="min-w-[120px] flex-1 gap-2"
              >
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  "Apply"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRefinementInput("");
                  setPhase("refine");
                }}
                disabled={busy}
                className="gap-2"
              >
                <PenLine className="h-4 w-4" />
                Refine
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setEnhancedText(null);
                  setPhase("configure");
                }}
                disabled={busy}
                size="sm"
              >
                Start Over
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={busy}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ── Refine Phase ───────────────────────────────────────────── */}
        {phase === "refine" && enhancedText && (
          <div className="space-y-4">
            <div className="grid">
              <div className={`col-start-1 row-start-1 ${loading ? "pointer-events-none opacity-40 blur-[1px]" : ""} transition-all`}>
                {/* Current enhanced preview */}
                <div className="min-w-0 space-y-2">
                  <Label className="text-muted-foreground">
                    Current Enhancement
                  </Label>
                  <div className="max-h-48 overflow-y-auto overflow-x-hidden rounded-md border border-border bg-muted/30 p-3 text-sm break-words">
                    <Markdown>{enhancedText}</Markdown>
                  </div>
                </div>

                {/* Refinement feedback */}
                <div className="space-y-2 mt-4">
                  <Label>What should be changed?</Label>
                  <Textarea
                    value={refinementInput}
                    onChange={(e) => setRefinementInput(e.target.value)}
                    placeholder='e.g. "Make it more technical", "Add a security section", "Shorten the user stories"'
                    rows={3}
                    disabled={busy}
                  />
                </div>
              </div>

              {loading && (
                <div className="col-start-1 row-start-1 z-10 flex items-center justify-center">
                  <AiProgressSteps
                    steps={refineSteps}
                    advanceAt={[8, 25]}
                    active={loading}
                  />
                </div>
              )}
            </div>

            {!loading && (
              <div className="flex gap-2">
                <Button
                  onClick={handleRefine}
                  disabled={busy || !refinementInput.trim()}
                  className="flex-1 gap-2"
                >
                  <PenLine className="h-4 w-4" />
                  Refine
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setPhase("result")}
                  disabled={busy}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
