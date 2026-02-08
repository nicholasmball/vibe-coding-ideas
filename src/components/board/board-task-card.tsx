"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, CheckSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskLabelBadges } from "./task-label-badges";
import { DueDateBadge } from "./due-date-badge";
import { TaskDetailDialog } from "./task-detail-dialog";
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
}

export function BoardTaskCard({
  task,
  ideaId,
  columnId,
  teamMembers,
  boardLabels,
  checklistItems,
}: BoardTaskCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task", task, columnId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assigneeInitials =
    task.assignee?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? null;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`group cursor-pointer rounded-md border border-border bg-background p-3 shadow-sm ${
          isDragging ? "opacity-50" : ""
        }`}
        onClick={() => setDetailOpen(true)}
      >
        <div className="flex items-start gap-2">
          <button
            className="mt-0.5 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            {/* Labels */}
            {task.labels.length > 0 && (
              <div className="mb-1.5">
                <TaskLabelBadges labels={task.labels} />
              </div>
            )}

            <p className="text-sm font-medium leading-snug">{task.title}</p>

            {task.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Metadata row: due date, checklist count, assignee */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 flex-wrap items-center gap-1.5">
                {task.due_date && <DueDateBadge dueDate={task.due_date} />}
                {task.checklist_total > 0 && (
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
                )}
              </div>
              {task.assignee && (
                <Avatar className="h-5 w-5">
                  <AvatarImage
                    src={task.assignee.avatar_url ?? undefined}
                  />
                  <AvatarFallback className="text-[10px]">
                    {assigneeInitials}
                  </AvatarFallback>
                </Avatar>
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
      />
    </>
  );
}
