"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Bot } from "lucide-react";
import { getLabelColorConfig } from "@/lib/utils";
import { createBoardTask, addLabelToTask } from "@/actions/board";
import { logTaskActivity } from "@/lib/activity";
import type { User, BoardLabel } from "@/types";

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideaId: string;
  columnId: string;
  teamMembers: User[];
  boardLabels: BoardLabel[];
  currentUserId: string;
  userBots?: User[];
}

export function TaskEditDialog({
  open,
  onOpenChange,
  ideaId,
  columnId,
  teamMembers,
  boardLabels,
  currentUserId,
  userBots = [],
}: TaskEditDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  function toggleLabel(labelId: string) {
    setSelectedLabelIds((prev) => {
      const next = new Set(prev);
      if (next.has(labelId)) {
        next.delete(labelId);
      } else {
        next.add(labelId);
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const taskId = await createBoardTask(
        ideaId,
        columnId,
        title.trim(),
        description.trim() || undefined,
        assigneeId || undefined
      );
      // Assign selected labels
      for (const labelId of selectedLabelIds) {
        await addLabelToTask(taskId, labelId, ideaId);
      }
      logTaskActivity(taskId, ideaId, currentUserId, "created");
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setAssigneeId("");
      setSelectedLabelIds(new Set());
    } catch {
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-assignee">Assignee</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.full_name ?? member.email}
                  </SelectItem>
                ))}
                {userBots.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground">
                      My Bots
                    </div>
                    {userBots
                      .filter((b) => !teamMembers.some((m) => m.id === b.id))
                      .map((bot) => (
                        <SelectItem key={bot.id} value={bot.id}>
                          <span className="inline-flex items-center gap-1">
                            <Bot className="h-3 w-3" />
                            {bot.full_name ?? bot.email}
                          </span>
                        </SelectItem>
                      ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          {boardLabels.length > 0 && (
            <div className="space-y-2">
              <Label>Labels</Label>
              <div className="flex flex-wrap gap-2">
                {boardLabels.map((label) => {
                  const config = getLabelColorConfig(label.color);
                  const isSelected = selectedLabelIds.has(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => toggleLabel(label.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                        isSelected
                          ? `${config.badgeClass} border-transparent`
                          : "border-border text-muted-foreground hover:border-foreground/30"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${config.swatchColor}`} />
                      {label.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
