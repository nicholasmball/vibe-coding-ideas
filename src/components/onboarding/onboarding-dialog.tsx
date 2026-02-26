"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Lightbulb,
  Bot,
  Cable,
  LayoutGrid,
  Copy,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StepIndicator } from "./step-indicator";
import { Confetti } from "./confetti";
import {
  completeOnboarding,
  createIdeaFromOnboarding,
  updateProfileFromOnboarding,
  enhanceOnboardingDescription,
} from "@/actions/onboarding";

const SUGGESTED_TAGS = [
  "ai",
  "web",
  "mobile",
  "tool",
  "game",
  "automation",
  "open-source",
];

interface OnboardingDialogProps {
  open: boolean;
  onComplete: () => void;
  userFullName: string | null;
  userAvatarUrl: string | null;
  userGithubUsername: string | null;
}

export function OnboardingDialog({
  open,
  onComplete,
  userFullName,
  userAvatarUrl,
  userGithubUsername,
}: OnboardingDialogProps) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Profile fields
  const [displayName, setDisplayName] = useState(userFullName ?? "");
  const [bio, setBio] = useState("");
  const [githubUsername, setGithubUsername] = useState(
    userGithubUsername ?? ""
  );

  // Idea fields
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // AI enhance state
  const [enhancing, setEnhancing] = useState(false);

  // Success state
  const [createdIdeaId, setCreatedIdeaId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const avatarInitial = displayName.charAt(0).toUpperCase() || "?";

  const goToStep = useCallback((s: number) => {
    setStep(s);
  }, []);

  const handleSkip = async () => {
    try {
      await completeOnboarding();
    } catch {
      // Non-critical
    }
    onComplete();
  };

  const handleEnhance = async () => {
    if (enhancing) return;
    if (!ideaTitle.trim()) {
      toast.error("Add a title first so AI knows what to enhance");
      return;
    }
    setEnhancing(true);
    try {
      const { enhanced } = await enhanceOnboardingDescription({
        title: ideaTitle,
        description: ideaDescription,
      });
      setIdeaDescription(enhanced);
      toast.success("Description enhanced!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to enhance description"
      );
    } finally {
      setEnhancing(false);
    }
  };

  const handleProfileContinue = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await updateProfileFromOnboarding({
        full_name: displayName || undefined,
        bio: bio || undefined,
        github_username: githubUsername || undefined,
      });
      goToStep(2);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateIdea = async () => {
    if (submitting) return;
    if (!ideaTitle.trim()) {
      toast.error("Give your idea a title");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createIdeaFromOnboarding({
        title: ideaTitle,
        description: ideaDescription || undefined,
        tags: selectedTags,
      });
      setCreatedIdeaId(result.ideaId);
      await completeOnboarding();
      goToStep(3);
    } catch (err) {
      if (err instanceof Error && "digest" in err) {
        const digest = (err as { digest?: string }).digest;
        if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
          throw err;
        }
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to create idea"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipIdea = async () => {
    try {
      await completeOnboarding();
    } catch {
      // Non-critical
    }
    goToStep(3);
  };

  const handleFinish = () => {
    onComplete();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const copyMcpCommand = async () => {
    try {
      await navigator.clipboard.writeText(
        "claude mcp add vibecodes https://vibecodes.co.uk/api/mcp"
      );
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-2xl border-border/50 p-0 sm:max-w-[580px]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Hidden accessible title */}
        <DialogTitle className="sr-only">Welcome to VibeCodes</DialogTitle>

        {/* Ambient glow at top */}
        <div className="pointer-events-none absolute top-0 right-0 left-0 z-0">
          <div className="mx-auto h-px w-64 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div className="mx-auto h-20 w-72 bg-primary/[0.08] blur-3xl" />
        </div>

        <StepIndicator totalSteps={4} currentStep={step} />

        {/* Step content — conditionally rendered */}
        <div
          key={step}
          className="animate-in fade-in-0 duration-300 relative z-[1]"
        >
          {step === 0 && (
            <div className="px-8 pt-6 pb-8 sm:px-10">
              <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/[0.08] px-3.5 py-1 text-xs font-semibold text-primary">
                <Sparkles
                  className="h-3.5 w-3.5 animate-spin"
                  style={{ animationDuration: "4s" }}
                />
                Getting started
              </div>
              <h2 className="-tracking-wide mb-2 text-2xl font-bold text-foreground sm:text-[28px]">
                Welcome to VibeCodes!
              </h2>
              <p className="mb-7 text-[15px] text-muted-foreground">
                Where your AI agents become real team members. Let&apos;s get
                you set up in under a minute.
              </p>

              <div className="mb-8 flex flex-col gap-2.5">
                {[
                  {
                    icon: Lightbulb,
                    color: "text-violet-400",
                    bg: "bg-violet-400/10",
                    title: "Share ideas & get feedback",
                    desc: "Post concepts, vote on others, and collaborate with the community",
                  },
                  {
                    icon: LayoutGrid,
                    color: "text-amber-400",
                    bg: "bg-amber-400/10",
                    title: "AI generates your task board",
                    desc: "Turn ideas into structured kanban boards with tasks, labels, and milestones",
                  },
                  {
                    icon: Bot,
                    color: "text-emerald-400",
                    bg: "bg-emerald-400/10",
                    title: "Agents pick up work autonomously",
                    desc: "Create AI personas that self-assign tasks, write code, and ship features",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-card/60 p-3.5 transition-colors hover:border-border hover:bg-card/80"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.bg}`}
                    >
                      <item.icon
                        className={`h-[18px] w-[18px] ${item.color}`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {item.title}
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={() => goToStep(1)}
              >
                Let&apos;s get started
                <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                onClick={handleSkip}
                className="mt-3 block w-full text-center text-[13px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              >
                Skip for now
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="px-8 pt-4 pb-8 sm:px-10">
              <div className="mb-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToStep(0)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground/60">
                  Step 2 of 4
                </span>
              </div>

              <h2 className="-tracking-wide mb-1 text-xl font-bold text-foreground sm:text-[22px]">
                Quick profile setup
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Help others know who you are. Takes 10 seconds.
              </p>

              <div className="mb-5 flex items-center gap-3.5">
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt="Avatar"
                    className="h-[52px] w-[52px] shrink-0 rounded-full"
                  />
                ) : (
                  <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-400 text-xl font-bold text-white">
                    {avatarInitial}
                  </div>
                )}
                <div className="text-[13px] leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Looking good!
                  </span>
                  <br />
                  Your avatar was imported from your account.
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-[13px] font-medium text-foreground">
                  Display name
                </label>
                <Input
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                  Bio
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                    optional
                  </span>
                </label>
                <Input
                  placeholder="e.g., Full-stack dev, AI enthusiast"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="mb-6">
                <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                  GitHub
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                    optional
                  </span>
                </label>
                <Input
                  placeholder="username"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                />
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleProfileContinue}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Continue"}
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </Button>
              <button
                onClick={() => goToStep(2)}
                className="mt-3 block w-full text-center text-[13px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              >
                Skip this step
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="px-8 pt-4 pb-8 sm:px-10">
              <div className="mb-4 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToStep(1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground/60">
                  Step 3 of 4
                </span>
              </div>

              <h2 className="-tracking-wide mb-1 text-xl font-bold text-foreground sm:text-[22px]">
                Drop your first idea
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                What would you like to build? Don&apos;t overthink it — AI can
                help refine it later.
              </p>

              <div className="mb-4">
                <label className="mb-1.5 block text-[13px] font-medium text-foreground">
                  Title
                </label>
                <Input
                  placeholder="e.g., A recipe sharing app with AI suggestions"
                  value={ideaTitle}
                  onChange={(e) => setIdeaTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
                    Description
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                      optional
                    </span>
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 px-2.5 text-[11px]"
                    onClick={handleEnhance}
                    disabled={enhancing}
                  >
                    <Sparkles
                      className={`h-3 w-3 ${enhancing ? "animate-spin" : ""}`}
                      style={enhancing ? { animationDuration: "2s" } : undefined}
                    />
                    {enhancing ? "Enhancing..." : "Enhance with AI"}
                  </Button>
                </div>
                <Textarea
                  placeholder="Briefly describe what it does, who it's for, or what problem it solves..."
                  value={ideaDescription}
                  onChange={(e) => setIdeaDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-[13px] font-medium text-foreground">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-3.5 py-1 text-[13px] font-medium transition-all ${
                        selectedTags.includes(tag)
                          ? "border-primary bg-primary/[0.08] text-primary"
                          : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/10 bg-primary/[0.04] px-3.5 py-2.5 text-xs text-muted-foreground">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                AI can enhance your description and generate a full task board
                after creation.
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleCreateIdea}
                disabled={submitting}
              >
                {submitting ? (
                  "Creating..."
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Create & Generate Board
                  </>
                )}
              </Button>
              <button
                onClick={handleSkipIdea}
                className="mt-3 block w-full text-center text-[13px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
              >
                I&apos;ll do this later
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="px-8 pt-8 pb-8 sm:px-10">
              <Confetti />

              <div
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-500/30 bg-emerald-500/10"
                style={{
                  animation:
                    "checkPop 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                }}
              >
                <Check className="h-7 w-7 text-emerald-400" />
              </div>

              <h2 className="-tracking-wide mb-1 text-center text-xl font-bold text-foreground sm:text-[22px]">
                You&apos;re all set!
              </h2>
              <p className="mb-7 text-center text-sm text-muted-foreground">
                {createdIdeaId
                  ? "Your idea is live. Here's what happens next:"
                  : "Here's what you can do next:"}
              </p>

              <div className="mb-7 flex flex-col gap-2.5">
                {createdIdeaId && (
                  <a
                    href={`/ideas/${createdIdeaId}`}
                    className="group flex items-center gap-3.5 rounded-xl border border-border/60 bg-card/60 p-3.5 transition-colors hover:border-border hover:bg-card/80"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-400/10">
                      <LayoutGrid className="h-[18px] w-[18px] text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        View your board
                      </p>
                      <p className="text-xs text-muted-foreground">
                        AI has generated tasks, labels, and milestones for your
                        idea
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                  </a>
                )}

                <a
                  href="/agents"
                  className="group flex items-center gap-3.5 rounded-xl border border-border/60 bg-card/60 p-3.5 transition-colors hover:border-border hover:bg-card/80"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/10">
                    <Bot className="h-[18px] w-[18px] text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Set up an AI agent
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Give your agent a name and role — it&apos;ll start picking
                      up tasks
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                </a>

                <div className="group rounded-xl border border-border/60 bg-card/60 p-3.5 transition-colors hover:border-border hover:bg-card/80">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/10">
                      <Cable className="h-[18px] w-[18px] text-sky-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        Connect Claude Code
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Link your AI assistant via MCP for full board control
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={copyMcpCommand}
                    className={`mt-2.5 ml-[52px] flex w-[calc(100%-52px)] items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[11px] transition-all ${
                      copied
                        ? "border-emerald-500/50 text-emerald-400"
                        : "border-border bg-background text-muted-foreground hover:border-border/80 hover:text-foreground"
                    }`}
                  >
                    <span className="truncate">
                      claude mcp add vibecodes
                      https://vibecodes.co.uk/api/mcp
                    </span>
                    <Copy className="ml-auto h-3.5 w-3.5 shrink-0 opacity-60" />
                  </button>
                </div>
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleFinish}
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Global animations */}
        <style jsx global>{`
          @keyframes checkPop {
            0% {
              transform: scale(0) rotate(-10deg);
            }
            60% {
              transform: scale(1.1) rotate(2deg);
            }
            100% {
              transform: scale(1) rotate(0);
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
