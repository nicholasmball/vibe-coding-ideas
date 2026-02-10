"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Tag, Trash2, Archive, ArchiveRestore } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ChecklistSection } from "./checklist-section";
import { ActivityTimeline } from "./activity-timeline";
import { TaskCommentsSection } from "./task-comments-section";
import { TaskAttachmentsSection } from "./task-attachments-section";
import { updateBoardTask, deleteBoardTask } from "@/actions/board";
import { createClient } from "@/lib/supabase/client";
import { logTaskActivity } from "@/lib/activity";
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
  currentUserId: string;
}

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  ideaId,
  boardLabels,
  checklistItems,
  teamMembers,
  currentUserId,
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [savingTitle, setSavingTitle] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const isArchived = task.archived;

  const [localAssigneeId, setLocalAssigneeId] = useState<string | null>(task.assignee_id);

  // Sync state when task prop changes
  const [lastTaskId, setLastTaskId] = useState(task.id);
  if (task.id !== lastTaskId) {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setLocalAssigneeId(task.assignee_id);
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
      logTaskActivity(task.id, ideaId, currentUserId, "title_changed", {
        from: task.title,
        to: title.trim(),
      });
    } catch {
      toast.error("Failed to update title");
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
      logTaskActivity(task.id, ideaId, currentUserId, "description_changed");
    } catch {
      toast.error("Failed to update description");
      setDescription(task.description ?? "");
    } finally {
      setSavingDesc(false);
    }
  }

  async function handleAssigneeChange(value: string) {
    const assigneeId = value === "unassigned" ? null : value;
    setLocalAssigneeId(assigneeId);

    try {
      await updateBoardTask(task.id, ideaId, { assignee_id: assigneeId });
      if (assigneeId) {
        const member = teamMembers.find((m) => m.id === assigneeId);
        logTaskActivity(task.id, ideaId, currentUserId, "assigned", {
          assignee_name: member?.full_name ?? "Unknown",
        });
      } else {
        logTaskActivity(task.id, ideaId, currentUserId, "unassigned");
      }
    } catch {
      toast.error("Failed to update assignee");
      setLocalAssigneeId(task.assignee_id);
    }
  }

  async function handleArchiveToggle() {
    setArchiving(true);
    const newArchived = !isArchived;
    try {
      await updateBoardTask(task.id, ideaId, { archived: newArchived });
      logTaskActivity(
        task.id,
        ideaId,
        currentUserId,
        newArchived ? "archived" : "unarchived"
      );
    } catch {
      toast.error("Failed to update archive status");
    } finally {
      setArchiving(false);
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

  const localAssignee = localAssigneeId
    ? teamMembers.find((m) => m.id === localAssigneeId) ?? task.assignee
    : null;
  const assigneeInitials =
    localAssignee?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? null;

  const commentCount = 0; // Will be populated by the component's own fetch
  const attachmentCount = task.attachment_count;
  const propCoverPath = task.cover_image_path ?? null;

  const [localCoverPath, setLocalCoverPath] = useState<string | null>(propCoverPath);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Sync from prop when task changes (e.g. via Realtime refresh)
  const [lastCoverProp, setLastCoverProp] = useState(propCoverPath);
  if (propCoverPath !== lastCoverProp) {
    setLocalCoverPath(propCoverPath);
    setLastCoverProp(propCoverPath);
  }

  useEffect(() => {
    if (!localCoverPath) {
      setCoverUrl(null);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase.storage
      .from("task-attachments")
      .createSignedUrl(localCoverPath, 3600)
      .then(({ data }) => {
        if (!cancelled && data?.signedUrl) setCoverUrl(data.signedUrl);
      });
    return () => { cancelled = true; };
  }, [localCoverPath]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Cover image */}
        {coverUrl && (
          <div className="h-40 w-full shrink-0 overflow-hidden">
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Header — always visible */}
        <DialogHeader className={`px-6 pb-0 ${coverUrl ? "pt-4" : "pt-6"}`}>
          <DialogTitle className="sr-only">Task Details</DialogTitle>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className="border-none p-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            disabled={savingTitle}
          />
        </DialogHeader>

        {/* Tabs */}
        <Tabs defaultValue="details" className="flex flex-1 flex-col overflow-hidden">
          <TabsList variant="line" className="w-full justify-start gap-0 px-6 pt-2">
            <TabsTrigger value="details" className="text-xs">
              Details
            </TabsTrigger>
            <TabsTrigger value="comments" className="text-xs">
              Comments
            </TabsTrigger>
            <TabsTrigger value="files" className="text-xs">
              Files
              {!!attachmentCount && attachmentCount > 0 && (
                <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px]">
                  {attachmentCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Details tab */}
          <TabsContent value="details" className="min-h-[400px] flex-1 overflow-y-auto px-6 py-4">
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
                    currentUserId={currentUserId}
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
                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Assignee</span>
                  <div className="flex items-center gap-2">
                    {localAssignee && (
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={localAssignee.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {assigneeInitials}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <Select
                      value={localAssigneeId ?? "unassigned"}
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

                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Due Date</span>
                  <div className="flex items-center gap-2">
                    <DueDatePicker
                      taskId={task.id}
                      ideaId={ideaId}
                      dueDate={task.due_date}
                      currentUserId={currentUserId}
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
                currentUserId={currentUserId}
              />
            </div>
          </TabsContent>

          {/* Comments tab */}
          <TabsContent value="comments" className="min-h-[400px] flex-1 overflow-y-auto px-6 py-4">
            <TaskCommentsSection
              taskId={task.id}
              ideaId={ideaId}
              currentUserId={currentUserId}
              teamMembers={teamMembers}
            />
          </TabsContent>

          {/* Files tab */}
          <TabsContent value="files" className="min-h-[400px] flex-1 overflow-y-auto px-6 py-4">
            <TaskAttachmentsSection
              taskId={task.id}
              ideaId={ideaId}
              currentUserId={currentUserId}
              coverImagePath={localCoverPath}
              onCoverChange={setLocalCoverPath}
            />
          </TabsContent>

          {/* Activity tab */}
          <TabsContent value="activity" className="min-h-[400px] flex-1 overflow-y-auto px-6 py-4">
            <ActivityTimeline taskId={task.id} ideaId={ideaId} />
          </TabsContent>
        </Tabs>

        {/* Footer — always visible */}
        <div className="flex justify-between border-t border-border px-6 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={handleArchiveToggle}
            disabled={archiving}
          >
            {isArchived ? (
              <>
                <ArchiveRestore className="h-3.5 w-3.5" />
                {archiving ? "Restoring..." : "Unarchive"}
              </>
            ) : (
              <>
                <Archive className="h-3.5 w-3.5" />
                {archiving ? "Archiving..." : "Archive"}
              </>
            )}
          </Button>
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
      </DialogContent>
    </Dialog>
  );
}
