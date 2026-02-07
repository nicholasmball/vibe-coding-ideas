"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TaskEditDialog } from "./task-edit-dialog";
import { deleteBoardTask } from "@/actions/board";
import type { BoardTaskWithAssignee, User } from "@/types";

interface BoardTaskCardProps {
  task: BoardTaskWithAssignee;
  ideaId: string;
  columnId: string;
  teamMembers: User[];
}

export function BoardTaskCard({
  task,
  ideaId,
  columnId,
  teamMembers,
}: BoardTaskCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteBoardTask(task.id, ideaId);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`group rounded-md border border-border bg-background p-3 shadow-sm ${
          isDragging ? "opacity-50" : ""
        }`}
      >
        <div className="flex items-start gap-2">
          <button
            className="mt-0.5 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">{task.title}</p>
            {task.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between">
              {task.assignee ? (
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={task.assignee.avatar_url ?? undefined}
                    />
                    <AvatarFallback className="text-[10px]">
                      {assigneeInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {task.assignee.full_name ?? "Anonymous"}
                  </span>
                </div>
              ) : (
                <span />
              )}
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <TaskEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        ideaId={ideaId}
        columnId={columnId}
        task={task}
        teamMembers={teamMembers}
      />
    </>
  );
}
