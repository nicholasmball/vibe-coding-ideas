"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateBot, deleteBot } from "@/actions/bots";
import { PromptBuilder } from "./prompt-builder";
import type { BotProfile } from "@/types";

interface EditBotDialogProps {
  bot: BotProfile;
  children: React.ReactNode;
}

export function EditBotDialog({ bot, children }: EditBotDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(bot.name);
  const [role, setRole] = useState(bot.role ?? "");
  const [systemPrompt, setSystemPrompt] = useState(bot.system_prompt ?? "");
  const [avatarUrl, setAvatarUrl] = useState(bot.avatar_url ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const isDefaultBot = bot.id === "a0000000-0000-4000-a000-000000000001";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      await updateBot(bot.id, {
        name: name.trim(),
        role: role.trim() || null,
        system_prompt: systemPrompt.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      });
      toast.success("Agent updated");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update agent");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeleteClick() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      confirmTimer.current = setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setDeleting(true);
    deleteBot(bot.id)
      .then(() => {
        toast.success("Agent deleted");
        setOpen(false);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete agent");
        setDeleting(false);
        setConfirmDelete(false);
      });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Edit Agent
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-bot-name">Name</Label>
            <Input
              id="edit-bot-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-bot-role">Role</Label>
            <Input
              id="edit-bot-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Developer"
              maxLength={50}
            />
          </div>

          <PromptBuilder
            role={role}
            value={systemPrompt}
            onChange={setSystemPrompt}
          />

          <div className="space-y-2">
            <Label htmlFor="edit-bot-avatar">Avatar URL</Label>
            <Input
              id="edit-bot-avatar"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              type="url"
            />
          </div>

          <div className="flex justify-between">
            {!isDefaultBot ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`gap-1.5 ${confirmDelete ? "text-destructive font-medium" : "text-muted-foreground"}`}
                onClick={handleDeleteClick}
                disabled={deleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deleting
                  ? "Deleting..."
                  : confirmDelete
                    ? "Are you sure?"
                    : "Delete"}
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || !name.trim()}>
                {submitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
