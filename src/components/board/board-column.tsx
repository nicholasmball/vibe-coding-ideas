"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { MoreHorizontal, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BoardTaskCard } from "./board-task-card";
import { TaskEditDialog } from "./task-edit-dialog";
import { ColumnEditDialog } from "./column-edit-dialog";
import { deleteBoardColumn } from "@/actions/board";
import type { BoardColumnWithTasks, User } from "@/types";

interface BoardColumnProps {
  column: BoardColumnWithTasks;
  ideaId: string;
  teamMembers: User[];
}

export function BoardColumn({ column, ideaId, teamMembers }: BoardColumnProps) {
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: "column", columnId: column.id },
  });

  const taskIds = column.tasks.map((t) => t.id);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteBoardColumn(column.id, ideaId);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <>
      <div
        className={`flex min-w-[280px] max-w-[320px] shrink-0 flex-col rounded-lg border border-border bg-muted/50 ${
          isOver ? "ring-2 ring-primary/50" : ""
        }`}
      >
        {/* Column header */}
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <h3 className="text-sm font-semibold">
            {column.title}{" "}
            <span className="text-muted-foreground">({column.tasks.length})</span>
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRenameOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Task list */}
        <div ref={setNodeRef} className="flex-1 space-y-2 overflow-y-auto p-2" style={{ minHeight: "100px" }}>
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
      />
      <ColumnEditDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        columnId={column.id}
        ideaId={ideaId}
        currentTitle={column.title}
      />
    </>
  );
}
