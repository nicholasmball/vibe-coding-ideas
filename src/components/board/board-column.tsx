"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { MoreHorizontal, Plus, Pencil, Trash2, GripVertical, CircleCheckBig, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { BoardTaskCard } from "./board-task-card";
import { TaskEditDialog } from "./task-edit-dialog";
import { ColumnEditDialog } from "./column-edit-dialog";
import { useBoardOps } from "./board-context";
import { deleteBoardColumn, archiveColumnTasks } from "@/actions/board";
import type {
  BoardColumnWithTasks,
  BoardLabel,
  BoardChecklistItem,
  User,
} from "@/types";

interface BoardColumnProps {
  column: BoardColumnWithTasks;
  totalTaskCount: number;
  ideaId: string;
  teamMembers: User[];
  boardLabels: BoardLabel[];
  checklistItemsByTaskId: Record<string, BoardChecklistItem[]>;
  highlightQuery?: string;
  currentUserId: string;
  initialTaskId?: string;
  userBots?: User[];
}

export function BoardColumn({
  column,
  totalTaskCount,
  ideaId,
  teamMembers,
  boardLabels,
  checklistItemsByTaskId,
  highlightQuery,
  currentUserId,
  initialTaskId,
  userBots = [],
}: BoardColumnProps) {
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const ops = useBoardOps();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const taskIds = column.tasks.map((t) => t.id);

  async function handleDelete() {
    const rollback = ops.deleteColumn(column.id);
    ops.incrementPendingOps();
    try {
      await deleteBoardColumn(column.id, ideaId);
    } catch {
      rollback();
      toast.error("Failed to delete column");
    } finally {
      ops.decrementPendingOps();
    }
  }

  async function handleArchiveAll() {
    const count = column.tasks.filter((t) => !t.archived).length;
    if (count === 0) return;
    const rollback = ops.archiveColumnTasks(column.id);
    ops.incrementPendingOps();
    try {
      await archiveColumnTasks(column.id, ideaId);
      toast.success(`Archived ${count} task${count !== 1 ? "s" : ""}`);
    } catch {
      rollback();
      toast.error("Failed to archive tasks");
    } finally {
      ops.decrementPendingOps();
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`flex max-h-full min-w-[280px] max-w-[320px] shrink-0 flex-col rounded-lg border border-border bg-muted/50 ${
          isOver ? "ring-2 ring-primary/50" : ""
        } ${isDragging ? "opacity-50" : ""}`}
      >
        {/* Column header */}
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex items-center gap-1.5">
            <button
              className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <h3 className="flex items-center gap-1 text-sm font-semibold">
              {column.title}
              {column.is_done_column && (
                <CircleCheckBig className="h-3.5 w-3.5 text-emerald-500" />
              )}
              <span className="text-muted-foreground">({totalTaskCount})</span>
            </h3>
          </div>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Column options</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {column.is_done_column && column.tasks.length > 0 && (
                <DropdownMenuItem onClick={handleArchiveAll}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive all
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Task list */}
        <div className="min-h-[60px] flex-1 space-y-2 overflow-y-auto p-2">
          <SortableContext
            items={taskIds}
            strategy={verticalListSortingStrategy}
          >
            {column.tasks.map((task) => (
              <BoardTaskCard
                key={task.id}
                task={task}
                ideaId={ideaId}
                columnId={column.id}
                teamMembers={teamMembers}
                boardLabels={boardLabels}
                checklistItems={checklistItemsByTaskId[task.id] ?? []}
                highlightQuery={highlightQuery}
                currentUserId={currentUserId}
                autoOpen={task.id === initialTaskId}
                userBots={userBots}
              />
            ))}
          </SortableContext>
        </div>

        {/* Add task button */}
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setAddTaskOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add task
          </Button>
        </div>
      </div>

      <TaskEditDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        ideaId={ideaId}
        columnId={column.id}
        teamMembers={teamMembers}
        boardLabels={boardLabels}
        currentUserId={currentUserId}
        userBots={userBots}
      />
      <ColumnEditDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        columnId={column.id}
        ideaId={ideaId}
        currentTitle={column.title}
        currentIsDoneColumn={column.is_done_column}
      />
    </>
  );
}
