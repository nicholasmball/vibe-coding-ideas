"use client";

import { useState, useEffect, useRef } from "react";
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
import type { ClarifyingQuestion } from "@/actions/ai";
import type { BotProfile } from "@/types";

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
}

export function EnhanceIdeaDialog({
  open,
  onOpenChange,
  ideaId,
  ideaTitle,
  currentDescription,
  bots,
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

  // Elapsed timer for progress messages during AI calls
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAiWorking = loading || generatingQuestions;

  useEffect(() => {
    if (isAiWorking) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAiWorking]);

  function getQuestionsMessage() {
    if (elapsedSeconds < 10) return "Generating questions...";
    if (elapsedSeconds < 30) return "Reading your idea...";
    if (elapsedSeconds < 60) return "Crafting targeted questions...";
    return "Still working — almost there...";
  }

  function getEnhancingMessage() {
    if (elapsedSeconds < 10) return "Enhancing...";
    if (elapsedSeconds < 30) return "Analyzing your description...";
    if (elapsedSeconds < 60) return "Writing enhanced version...";
    if (elapsedSeconds < 120) return "Polishing the details — this can take a minute...";
    return "Still working — almost there...";
  }

  const busy = loading || applying || generatingQuestions;
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
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
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
            {/* Persona selector */}
            {activeBots.length > 0 && (
              <div className="space-y-2">
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
            <div className="space-y-2">
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
            <div className="flex items-center gap-2">
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
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Current Description
              </Label>
              <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-sm">
                <Markdown>{currentDescription}</Markdown>
              </div>
            </div>

            <Button
              onClick={handleNext}
              disabled={busy || !prompt.trim()}
              className="w-full gap-2"
            >
              {generatingQuestions || loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {generatingQuestions
                    ? getQuestionsMessage()
                    : getEnhancingMessage()}
                </>
              ) : askQuestions ? (
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
          </div>
        )}

        {/* ── Questions Phase ────────────────────────────────────────── */}
        {phase === "questions" && (
          <div className="space-y-4">
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

            <div className="flex gap-2">
              <Button
                onClick={handleEnhanceWithAnswers}
                disabled={busy}
                className="flex-1 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {getEnhancingMessage()}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Enhance with Answers
                  </>
                )}
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
          </div>
        )}

        {/* ── Result Phase ───────────────────────────────────────────── */}
        {phase === "result" && enhancedText && (
          <div className="space-y-4">
            {/* Side-by-side comparison */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Original</Label>
                <div className="max-h-60 overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-sm">
                  <Markdown>{currentDescription}</Markdown>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-primary">Enhanced</Label>
                <div className="max-h-60 overflow-y-auto rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                  <Markdown>{enhancedText}</Markdown>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleApply}
                disabled={busy}
                className="flex-1 gap-2"
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
              <Button
                variant="ghost"
                onClick={() => {
                  setEnhancedText(null);
                  setPhase("configure");
                }}
                disabled={busy}
              >
                Start Over
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={busy}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* ── Refine Phase ───────────────────────────────────────────── */}
        {phase === "refine" && enhancedText && (
          <div className="space-y-4">
            {/* Current enhanced preview */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">
                Current Enhancement
              </Label>
              <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-sm">
                <Markdown>{enhancedText}</Markdown>
              </div>
            </div>

            {/* Refinement feedback */}
            <div className="space-y-2">
              <Label>What should be changed?</Label>
              <Textarea
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value)}
                placeholder='e.g. "Make it more technical", "Add a security section", "Shorten the user stories"'
                rows={3}
                disabled={busy}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRefine}
                disabled={busy || !refinementInput.trim()}
                className="flex-1 gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {getEnhancingMessage()}
                  </>
                ) : (
                  <>
                    <PenLine className="h-4 w-4" />
                    Refine
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setPhase("result")}
                disabled={busy}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
