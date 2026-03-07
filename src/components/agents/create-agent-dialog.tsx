"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bot, Cable, CheckCircle2, Crown, Upload, Wrench } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BOT_ROLE_TEMPLATES } from "@/lib/constants";
import { createBot } from "@/actions/bots";
import { PromptBuilder } from "@/components/profile/prompt-builder";
import { WorkflowTemplateEditor } from "./workflow-template-editor";
import { generatePromptFromFields } from "@/lib/prompt-builder";
import { createClient } from "@/lib/supabase/client";
import { cn, getInitials } from "@/lib/utils";
import type { StructuredPromptFields } from "@/lib/prompt-builder";
import type { WorkflowTemplate } from "@/types";

const TEMPLATE_CHIPS: { role: string; icon: string }[] = [
  { role: "Developer", icon: "\u{1F4BB}" },
  { role: "UX Designer", icon: "\u{1F3A8}" },
  { role: "QA Tester", icon: "\u{1F50D}" },
  { role: "Product Owner", icon: "\u{1F4CB}" },
  { role: "Business Analyst", icon: "\u{1F4CA}" },
  { role: "DevOps", icon: "\u{2699}" },
];

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAgentDialog({ open, onOpenChange }: CreateAgentDialogProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [bio, setBio] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [deliverablesInput, setDeliverablesInput] = useState("");
  const [agentType, setAgentType] = useState<"worker" | "orchestrator">("worker");
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);
  const [createdName, setCreatedName] = useState("");
  const [templateStructured, setTemplateStructured] =
    useState<StructuredPromptFields | null>(null);
  const [promptKey, setPromptKey] = useState(0);

  // Avatar upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleTemplateSelect(templateRole: string) {
    const template = BOT_ROLE_TEMPLATES.find((t) => t.role === templateRole);
    if (template) {
      setSelectedTemplate(templateRole);
      setRole(template.role);
      if (template.structured) {
        setSystemPrompt(generatePromptFromFields(template.role, template.structured));
        setTemplateStructured({ ...template.structured });
      } else {
        setSystemPrompt(template.prompt);
        setTemplateStructured(null);
      }
      setPromptKey((k) => k + 1);
    }
  }

  function handleReset() {
    setName("");
    setRole("");
    setSystemPrompt("");
    setBio("");
    setSkillsInput("");
    setDeliverablesInput("");
    setAgentType("worker");
    setWorkflowTemplates([]);
    setSelectedTemplate(null);
    setTemplateStructured(null);
    setPromptKey((k) => k + 1);
    setCreated(false);
    setCreatedName("");
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleOpenChange(isOpen: boolean) {
    onOpenChange(isOpen);
    if (!isOpen) handleReset();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2MB or less");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function parseSkills(): string[] {
    if (!skillsInput.trim()) return [];
    return skillsInput
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10);
  }

  function parseDeliverables(): string[] {
    if (!deliverablesInput.trim()) return [];
    return deliverablesInput
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const skills = parseSkills();
      const deliverables = parseDeliverables();

      // Create bot first to get ID, then upload avatar
      const botId = await createBot(
        name.trim(),
        role.trim() || null,
        systemPrompt.trim() || null,
        null,
        bio.trim() || null,
        skills,
        deliverables,
        workflowTemplates,
        agentType
      );

      // Upload avatar if selected
      if (selectedFile && botId) {
        const supabase = createClient();
        const filePath = `${botId}/avatar`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, selectedFile, { upsert: true, cacheControl: "3600" });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);
          const avatarUrl = `${publicUrl}?t=${Date.now()}`;

          // Update bot with avatar URL
          const { updateBot } = await import("@/actions/bots");
          await updateBot(botId, { avatar_url: avatarUrl });
        }
      }

      setCreatedName(name.trim());
      setCreated(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setSubmitting(false);
    }
  }

  const initials = getInitials(name || null);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        {created ? (
          <div className="flex flex-col items-center gap-5 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">Agent Created</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{createdName}</span> is ready to go.
              </p>
            </div>
            <div className="w-full rounded-lg border border-violet-500/15 bg-violet-500/[0.04] p-4">
              <div className="flex items-start gap-3">
                <Cable className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Next Step</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Connect your agent to{" "}
                    <span className="font-medium text-foreground">Claude Code</span>{" "}
                    via MCP so it can start working on tasks.
                  </p>
                  <Link
                    href="/guide/mcp-integration"
                    target="_blank"
                    className="mt-2 inline-flex items-center text-sm font-medium text-violet-400 hover:text-violet-300"
                  >
                    Setup guide &rarr;
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex w-full justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => handleOpenChange(false)}
              >
                Skip for now
              </Button>
              <Button onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
        <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Create Agent
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar + Name + Tagline row */}
          <div className="flex gap-4">
            <div
              className="group relative cursor-pointer shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar className="h-14 w-14">
                <AvatarImage src={previewUrl ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-lg border-2 border-dashed border-border">
                  {previewUrl ? initials : "\u{1F4F7}"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Upload className="h-4 w-4 text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <Label htmlFor="bot-name" className="text-xs">Name</Label>
                <Input
                  id="bot-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='e.g. Dev Alpha, Sarah the Reviewer'
                  maxLength={100}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bot-bio" className="text-xs">
                  Tagline <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="bot-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder='e.g. "I break things so users don&apos;t have to"'
                  maxLength={500}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Template picker chips */}
          <div className="space-y-2">
            <Label className="text-xs">Start from a template</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {TEMPLATE_CHIPS.map((t) => (
                <button
                  key={t.role}
                  type="button"
                  onClick={() => handleTemplateSelect(t.role)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-md border py-2 px-2 text-xs font-medium transition-colors",
                    selectedTemplate === t.role
                      ? "border-violet-500 bg-violet-500/15 text-violet-400"
                      : "border-border text-muted-foreground hover:border-violet-500/30 hover:text-foreground"
                  )}
                >
                  <span className="text-base">{t.icon}</span>
                  {t.role}
                </button>
              ))}
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1">
            <Label htmlFor="bot-role" className="text-xs">Role</Label>
            <Input
              id="bot-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Developer, QA Tester"
              maxLength={50}
            />
            <p className="text-[10px] text-muted-foreground">
              Short role label shown as a badge next to the agent&apos;s name.
            </p>
          </div>

          {/* Agent Type Toggle */}
          <div className="space-y-1">
            <Label className="text-xs">Agent Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAgentType("worker")}
                className={cn(
                  "flex items-center gap-2 rounded-md border py-2 px-3 text-xs font-medium transition-colors",
                  agentType === "worker"
                    ? "border-blue-500 bg-blue-500/15 text-blue-400"
                    : "border-border text-muted-foreground hover:border-blue-500/30 hover:text-foreground"
                )}
              >
                <Wrench className="h-3.5 w-3.5" />
                Worker
              </button>
              <button
                type="button"
                onClick={() => setAgentType("orchestrator")}
                className={cn(
                  "flex items-center gap-2 rounded-md border py-2 px-3 text-xs font-medium transition-colors",
                  agentType === "orchestrator"
                    ? "border-amber-500 bg-amber-500/15 text-amber-400"
                    : "border-border text-muted-foreground hover:border-amber-500/30 hover:text-foreground"
                )}
              >
                <Crown className="h-3.5 w-3.5" />
                Orchestrator
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {agentType === "worker"
                ? "Workers complete tasks and produce deliverables."
                : "Orchestrators manage workflows and delegate tasks to workers."}
            </p>
          </div>

          {/* Skills (comma-separated) */}
          <div className="space-y-1">
            <Label htmlFor="bot-skills" className="text-xs">
              Skills <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="bot-skills"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="Comma-separated skills"
              maxLength={300}
            />
            <p className="text-[10px] text-muted-foreground">
              Shown on the agent card and profile. Helps the community find your agent.
            </p>
          </div>

          {/* Deliverables (workers only) */}
          {agentType === "worker" && (
            <div className="space-y-1">
              <Label htmlFor="bot-deliverables" className="text-xs">
                Deliverables <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="bot-deliverables"
                value={deliverablesInput}
                onChange={(e) => setDeliverablesInput(e.target.value)}
                placeholder="e.g. design document, wireframes, test plan"
                maxLength={1000}
              />
              <p className="text-[10px] text-muted-foreground">
                What this agent produces when completing workflow steps.
              </p>
            </div>
          )}

          {/* Workflow Templates (orchestrators only) */}
          {agentType === "orchestrator" && (
            <WorkflowTemplateEditor
              value={workflowTemplates}
              onChange={setWorkflowTemplates}
            />
          )}

          {/* Prompt Builder */}
          <PromptBuilder
            key={promptKey}
            role={role}
            value={systemPrompt}
            onChange={setSystemPrompt}
            templateStructured={templateStructured}
          />

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? "Creating..." : "Create Agent"}
            </Button>
          </div>
        </form>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
