"use client";

import { useState, useRef } from "react";
import { Tag, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskLabelBadges } from "./task-label-badges";
import { LabelPicker } from "./label-picker";
import { DueDatePicker } from "./due-date-picker";
import { DueDateBadge } from "./due-date-badge";
import { ChecklistSection } from "./checklist-section";
import { updateBoardTask, deleteBoardTask } from "@/actions/board";
import type {
  BoardTaskWithAssignee,
  BoardLabel,
  BoardChecklistItem,
  User,
} from "@/types";

interface TaskDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: BoardTaskWithAssignee;
  ideaId: string;
  boardLabels: BoardLabel[];
  checklistItems: BoardChecklistItem[];
  teamMembers: User[];
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  ideaId,
  boardLabels,
  checklistItems,
  teamMembers,
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [savingTitle, setSavingTitle] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync state when task prop changes
  const [lastTaskId, setLastTaskId] = useState(task.id);
  if (task.id !== lastTaskId) {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setLastTaskId(task.id);
  }

  async function handleTitleBlur() {
    if (title.trim() === task.title) return;
    if (!title.trim()) {
      setTitle(task.title);
      return;
    }
    setSavingTitle(true);
    try {
      await updateBoardTask(task.id, ideaId, { title: title.trim() });
    } catch {
      setTitle(task.title);
    } finally {
      setSavingTitle(false);
    }
  }

  async function handleDescriptionBlur() {
    const newDesc = description.trim() || null;
    if (newDesc === (task.description ?? null)) return;
    setSavingDesc(true);
    try {
      await updateBoardTask(task.id, ideaId, { description: newDesc });
    } catch {
      setDescription(task.description ?? "");
    } finally {
      setSavingDesc(false);
    }
  }

  async function handleAssigneeChange(value: string) {
    const assigneeId = value === "unassigned" ? null : value;
    try {
      await updateBoardTask(task.id, ideaId, { assignee_id: assigneeId });
    } catch {
      // RLS
    }
  }

  const confirmTimer = useRef<ReturnType<typeof setTimeout>>(null);

  function handleDeleteClick() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      confirmTimer.current = setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    setDeleting(true);
    deleteBoardTask(task.id, ideaId)
      .then(() => onOpenChange(false))
      .catch(() => {
        setDeleting(false);
        setConfirmDelete(false);
      });
  }

  const assigneeInitials =
    task.assignee?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Task Details</DialogTitle>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="border-none p-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            disabled={savingTitle}
          />
        </DialogHeader>

        <div className="space-y-5">
          {/* Labels */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Labels</span>
              <LabelPicker
                boardLabels={boardLabels}
                taskLabels={task.labels}
                taskId={task.id}
                ideaId={ideaId}
              >
                <Button variant="outline" size="sm" className="h-6 gap-1 text-xs">
                  <Tag className="h-3 w-3" />
                  Edit
                </Button>
              </LabelPicker>
            </div>
            {task.labels.length > 0 && (
              <TaskLabelBadges labels={task.labels} maxVisible={10} />
            )}
          </div>

          {/* Assignee & Due Date row */}
          <div className="flex flex-wrap gap-4">
            {/* Assignee */}
            <div className="space-y-1.5">
              <span className="text-sm font-medium">Assignee</span>
              <div className="flex items-center gap-2">
                {task.assignee && (
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={task.assignee.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {assigneeInitials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <Select
                  value={task.assignee_id ?? "unassigned"}
                  onValueChange={handleAssigneeChange}
                >
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name ?? member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <span className="text-sm font-medium">Due Date</span>
              <div className="flex items-center gap-2">
                <DueDatePicker
                  taskId={task.id}
                  ideaId={ideaId}
                  dueDate={task.due_date}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Description</span>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Add a description..."
              rows={3}
              className="text-sm"
              disabled={savingDesc}
            />
          </div>

          <Separator />

          {/* Checklist */}
          <ChecklistSection
            items={checklistItems}
            taskId={task.id}
            ideaId={ideaId}
          />

          <Separator />

          {/* Actions */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 ${confirmDelete ? "text-destructive font-medium" : "text-muted-foreground"}`}
              onClick={handleDeleteClick}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Deleting..." : confirmDelete ? "Are you sure?" : "Delete task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
