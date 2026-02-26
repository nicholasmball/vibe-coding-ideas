"use client";

import { useState, useCallback, memo } from "react";
import { toast } from "sonner";
import { Droppable, Draggable } from "@happy-doc/dnd";
import { MoreHorizontal, Plus, Pencil, Trash2, GripVertical, CircleCheckBig, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { BoardTaskCard } from "./board-task-card";
import { TaskEditDialog } from "./task-edit-dialog";
import { ColumnEditDialog } from "./column-edit-dialog";
import { useBoardOps } from "./board-context";
import { deleteBoardColumn, archiveColumnTasks } from "@/actions/board";
import { undoableAction } from "@/lib/undo-toast";
import type {
  BoardColumnWithTasks,
  BoardLabel,
  BoardChecklistItem,
  User,
} from "@/types";

const EMPTY_CHECKLIST: BoardChecklistItem[] = [];

interface BoardColumnProps {
  column: BoardColumnWithTasks;
  index: number;
  totalTaskCount: number;
  ideaId: string;
  teamMembers: User[];
  boardLabels: BoardLabel[];
  checklistItemsByTaskId: Record<string, BoardChecklistItem[]>;
  highlightQuery?: string;
  currentUserId: string;
  initialTaskId?: string;
  userBots?: User[];
  coverImageUrls?: Record<string, string>;
  hasApiKey?: boolean;
  ideaDescription?: string;
  isReadOnly?: boolean;
  isDragTarget?: boolean;
}

export const BoardColumn = memo(function BoardColumn({
  column,
  index,
  totalTaskCount,
  ideaId,
  teamMembers,
  boardLabels,
  checklistItemsByTaskId,
  highlightQuery,
  currentUserId,
  initialTaskId,
  userBots = [],
  coverImageUrls = {},
  hasApiKey = false,
  ideaDescription = "",
  isReadOnly = false,
  isDragTarget = false,
}: BoardColumnProps) {
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const ops = useBoardOps();

  const handleDelete = useCallback(() => {
    const rollback = ops.deleteColumn(column.id);
    ops.incrementPendingOps();
    undoableAction({
      message: `Deleted "${column.title}"`,
      execute: async () => {
        try {
          await deleteBoardColumn(column.id, ideaId);
        } finally {
          ops.decrementPendingOps();
        }
      },
      undo: () => {
        rollback();
        ops.decrementPendingOps();
      },
      errorMessage: "Failed to delete column",
    });
  }, [ops, column.id, column.title, ideaId]);

  const handleArchiveAll = useCallback(async () => {
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
  }, [ops, column.id, column.tasks, ideaId]);

  return (
    <Draggable draggableId={column.id} index={index} isDragDisabled={isReadOnly}>
      {(provided, snapshot) => (
        <>
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            data-testid={`column-${column.id}`}
            data-column-id={column.id}
            className={`flex max-h-full min-w-[280px] max-w-[320px] shrink-0 snap-start flex-col rounded-lg border border-border bg-muted/50 ${
              snapshot.isDragging ? "opacity-50" : ""
            }`}
          >
            {/* Column header */}
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <div className="flex items-center gap-1.5">
                {!isReadOnly && (
                  <button
                    data-testid="column-drag-handle"
                    className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing touch-none"
                    {...(provided.dragHandleProps ?? {})}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                )}
                <h3 className="flex items-center gap-1 text-sm font-semibold">
                  {column.title}
                  {column.is_done_column && <CircleCheckBig className="h-3.5 w-3.5 text-emerald-500" />}
                  <span className="text-muted-foreground">({totalTaskCount})</span>
                </h3>
              </div>
              {!isReadOnly && (
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
              )}
            </div>

            {/* Task list — Droppable */}
            <Droppable droppableId={column.id} type="TASK" isDropDisabled={isReadOnly}>
              {(droppableProvided, droppableSnapshot) => (
                <div
                  ref={droppableProvided.innerRef}
                  {...droppableProvided.droppableProps}
                  className={`min-h-[60px] flex-1 space-y-2 overflow-y-auto p-2 ${
                    droppableSnapshot.isDraggingOver || isDragTarget ? "ring-2 ring-primary/50 ring-inset" : ""
                  }`}
                >
                  {column.tasks.length === 0 && (
                    <div className="flex items-center justify-center rounded-md border border-dashed border-border py-8 text-center">
                      <p className="text-xs text-muted-foreground">
                        {isReadOnly ? "No tasks in this column" : "No tasks yet — drag here or click + to add"}
                      </p>
                    </div>
                  )}
                  {column.tasks.map((task, taskIndex) => (
                    <BoardTaskCard
                      key={task.id}
                      task={task}
                      index={taskIndex}
                      ideaId={ideaId}
                      columnId={column.id}
                      teamMembers={teamMembers}
                      boardLabels={boardLabels}
                      checklistItems={checklistItemsByTaskId[task.id] ?? EMPTY_CHECKLIST}
                      highlightQuery={highlightQuery}
                      currentUserId={currentUserId}
                      autoOpen={task.id === initialTaskId}
                      userBots={userBots}
                      initialCoverUrl={task.cover_image_path ? coverImageUrls[task.cover_image_path] : undefined}
                      isReadOnly={isReadOnly}
                      hasApiKey={hasApiKey}
                    />
                  ))}
                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Add task button */}
            {!isReadOnly && (
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
            )}
          </div>

          {!isReadOnly && (
            <>
              <TaskEditDialog
                open={addTaskOpen}
                onOpenChange={setAddTaskOpen}
                ideaId={ideaId}
                columnId={column.id}
                teamMembers={teamMembers}
                boardLabels={boardLabels}
                currentUserId={currentUserId}
                userBots={userBots}
                hasApiKey={hasApiKey}
                ideaDescription={ideaDescription}
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
          )}
        </>
      )}
    </Draggable>
  );
});
