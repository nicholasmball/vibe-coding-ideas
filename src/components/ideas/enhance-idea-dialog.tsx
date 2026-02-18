"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, RotateCcw } from "lucide-react";
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
import { Markdown } from "@/components/ui/markdown";
import { enhanceIdeaDescription, applyEnhancedDescription } from "@/actions/ai";
import { PromptTemplateSelector } from "@/components/ai/prompt-template-selector";
import type { BotProfile } from "@/types";

const DEFAULT_PROMPT =
  "Improve this idea description. Add more detail, user stories, technical scope, and a clear product vision. Keep the original intent and key points, but make it more comprehensive and well-structured.";

interface EnhanceIdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideaId: string;
  currentDescription: string;
  bots: BotProfile[];
}

export function EnhanceIdeaDialog({
  open,
  onOpenChange,
  ideaId,
  currentDescription,
  bots,
}: EnhanceIdeaDialogProps) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [selectedBotId, setSelectedBotId] = useState<string>("default");
  const [enhancedText, setEnhancedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  const busy = loading || applying;
  const activeBots = bots.filter((b) => b.is_active);

  async function handleEnhance() {
    setLoading(true);
    setEnhancedText(null);
    try {
      const personaPrompt =
        selectedBotId !== "default"
          ? activeBots.find((b) => b.id === selectedBotId)?.system_prompt
          : null;

      const result = await enhanceIdeaDescription(ideaId, prompt, personaPrompt);
      setEnhancedText(result.enhanced);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to enhance description"
      );
    } finally {
      setLoading(false);
    }
  }

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

  function resetState() {
    setEnhancedText(null);
    setPrompt(DEFAULT_PROMPT);
    setSelectedBotId("default");
  }

  function handleOpenChange(value: boolean) {
    if (busy) return;
    if (!value) resetState();
    onOpenChange(value);
  }

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
          <DialogDescription>
            AI will improve your idea description based on your prompt.
          </DialogDescription>
        </DialogHeader>

        {!enhancedText ? (
          <div className="space-y-4">
            {/* Persona selector */}
            {activeBots.length > 0 && (
              <div className="space-y-2">
                <Label>AI Persona</Label>
                <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select persona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default (Product Manager)</SelectItem>
                    {activeBots.map((bot) => (
                      <SelectItem key={bot.id} value={bot.id}>
                        {bot.name}{bot.role ? ` (${bot.role})` : ""}
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

            {/* Current description preview */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Current Description</Label>
              <div className="max-h-40 overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-sm">
                <Markdown>{currentDescription}</Markdown>
              </div>
            </div>

            <Button onClick={handleEnhance} disabled={busy || !prompt.trim()} className="w-full gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Enhance
                </>
              )}
            </Button>
          </div>
        ) : (
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
              <Button onClick={handleApply} disabled={busy} className="flex-1 gap-2">
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
                onClick={handleEnhance}
                disabled={busy}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Try Again
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
      </DialogContent>
    </Dialog>
  );
}
