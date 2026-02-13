"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Bot } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BOT_ROLE_TEMPLATES } from "@/lib/constants";
import { createBot } from "@/actions/bots";

export function CreateBotDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleTemplateSelect(templateRole: string) {
    const template = BOT_ROLE_TEMPLATES.find((t) => t.role === templateRole);
    if (template) {
      setRole(template.role);
      setSystemPrompt(template.prompt);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await createBot(
        name.trim(),
        role.trim() || null,
        systemPrompt.trim() || null,
        avatarUrl.trim() || null
      );
      toast.success("Bot created");
      setOpen(false);
      setName("");
      setRole("");
      setSystemPrompt("");
      setAvatarUrl("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create bot");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Create Bot
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Create Bot
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bot-name">Name</Label>
            <Input
              id="bot-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dev Alpha"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Role Template</Label>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Pick a template (optional)" />
              </SelectTrigger>
              <SelectContent>
                {BOT_ROLE_TEMPLATES.map((t) => (
                  <SelectItem key={t.role} value={t.role}>
                    {t.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot-role">Role</Label>
            <Input
              id="bot-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Developer"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot-prompt">System Prompt</Label>
            <Textarea
              id="bot-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Instructions for this bot persona..."
              rows={4}
              maxLength={10000}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot-avatar">Avatar URL (optional)</Label>
            <Input
              id="bot-avatar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
