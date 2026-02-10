"use client";

import { useState, useMemo, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, CheckSquare, Paperclip, Archive } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { TaskLabelBadges } from "./task-label-badges";
import { DueDateBadge } from "./due-date-badge";
import { TaskDetailDialog } from "./task-detail-dialog";
import { createClient } from "@/lib/supabase/client";
import type {
  BoardTaskWithAssignee,
  BoardLabel,
  BoardChecklistItem,
  User,
} from "@/types";

interface BoardTaskCardProps {
  task: BoardTaskWithAssignee;
  ideaId: string;
  columnId: string;
  teamMembers: User[];
  boardLabels: BoardLabel[];
  checklistItems: BoardChecklistItem[];
  highlightQuery?: string;
  currentUserId: string;
}

function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  if (!query) return <>{text}</>;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-500/30 rounded-sm">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function BoardTaskCard({
  task,
  ideaId,
  columnId,
  teamMembers,
  boardLabels,
  checklistItems,
  highlightQuery,
  currentUserId,
}: BoardTaskCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const isArchived = task.archived;
  const attachmentCount = task.attachment_count;
  const coverImagePath = task.cover_image_path;

  // Fetch signed URL for cover image
  useEffect(() => {
    if (!coverImagePath) {
      setCoverUrl(null);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase.storage
      .from("task-attachments")
      .createSignedUrl(coverImagePath, 3600)
      .then(({ data }) => {
        if (!cancelled && data?.signedUrl) setCoverUrl(data.signedUrl);
      });
    return () => { cancelled = true; };
  }, [coverImagePath]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task, columnId },
    disabled: !!isArchived,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assigneeInitials = useMemo(
    () =>
      task.assignee?.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() ?? null,
    [task.assignee?.full_name]
  );

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`group cursor-pointer overflow-hidden rounded-md border border-border bg-background shadow-sm ${
          isDragging ? "opacity-50" : ""
        } ${isArchived ? "opacity-50" : ""}`}
        onClick={() => setDetailOpen(true)}
      >
        {coverUrl && (
          <div className="h-32 w-full">
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="flex items-start gap-2 p-3">
          {!isArchived && (
            <button
              className="mt-0.5 cursor-grab text-muted-foreground opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 active:cursor-grabbing touch-none"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            {/* Labels */}
            {task.labels.length > 0 && (
              <div className="mb-1.5">
                <TaskLabelBadges labels={task.labels} />
              </div>
            )}

            <p className="text-sm font-medium leading-snug">
              {highlightQuery ? (
                <HighlightedText text={task.title} query={highlightQuery} />
              ) : (
                task.title
              )}
            </p>

            {task.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {highlightQuery ? (
                  <HighlightedText
                    text={task.description}
                    query={highlightQuery}
                  />
                ) : (
                  task.description
                )}
              </p>
            )}

            {/* Metadata row */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 flex-wrap items-center gap-1.5">
                {isArchived && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                    <Archive className="h-3 w-3" />
                    Archived
                  </span>
                )}
                {task.due_date && <DueDateBadge dueDate={task.due_date} />}
                {task.checklist_total > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                          task.checklist_done === task.checklist_total
                            ? "text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        <CheckSquare className="h-3 w-3" />
                        {task.checklist_done}/{task.checklist_total}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Checklist</TooltipContent>
                  </Tooltip>
                )}
                {!!attachmentCount && attachmentCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        {attachmentCount}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Attachments</TooltipContent>
                  </Tooltip>
                )}
              </div>
              {task.assignee && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={task.assignee.avatar_url ?? undefined}
                      />
                      <AvatarFallback className="text-[10px]">
                        {assigneeInitials}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    {task.assignee.full_name ?? "Assigned"}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>
      <TaskDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        task={task}
        ideaId={ideaId}
        boardLabels={boardLabels}
        checklistItems={checklistItems}
        teamMembers={teamMembers}
        currentUserId={currentUserId}
      />
    </>
  );
}
