"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { BoardColumn } from "./board-column";
import { AddColumnButton } from "./add-column-button";
import { moveBoardTask } from "@/actions/board";
import { POSITION_GAP } from "@/lib/constants";
import type {
  BoardColumnWithTasks,
  BoardTaskWithAssignee,
  User,
} from "@/types";

interface KanbanBoardProps {
  columns: BoardColumnWithTasks[];
  ideaId: string;
  teamMembers: User[];
}

export function KanbanBoard({
  columns: initialColumns,
  ideaId,
  teamMembers,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeTask, setActiveTask] = useState<BoardTaskWithAssignee | null>(
    null
  );

  // Update columns when server data changes (via realtime refresh)
  // Use a key based on serialized column/task IDs to detect real changes
  const serverKey = JSON.stringify(
    initialColumns.map((c) => [c.id, c.tasks.map((t) => t.id)])
  );
  const [lastServerKey, setLastServerKey] = useState(serverKey);
  if (serverKey !== lastServerKey && !activeTask) {
    setColumns(initialColumns);
    setLastServerKey(serverKey);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const task = active.data.current?.task as BoardTaskWithAssignee | undefined;
    if (task) setActiveTask(task);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;
      if (!activeData || activeData.type !== "task") return;

      const activeColumnId = activeData.columnId as string;

      // Determine target column
      let overColumnId: string;
      if (overData?.type === "column") {
        overColumnId = overData.columnId as string;
      } else if (overData?.type === "task") {
        overColumnId = overData.columnId as string;
      } else {
        // Droppable area (column-xxx)
        const overId = String(over.id);
        if (overId.startsWith("column-")) {
          overColumnId = overId.replace("column-", "");
        } else {
          return;
        }
      }

      if (activeColumnId === overColumnId) return;

      // Move task between columns optimistically
      setColumns((prev) => {
        const sourceCol = prev.find((c) => c.id === activeColumnId);
        const destCol = prev.find((c) => c.id === overColumnId);
        if (!sourceCol || !destCol) return prev;

        const taskIndex = sourceCol.tasks.findIndex(
          (t) => t.id === active.id
        );
        if (taskIndex === -1) return prev;

        const task = sourceCol.tasks[taskIndex];

        return prev.map((col) => {
          if (col.id === activeColumnId) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== active.id),
            };
          }
          if (col.id === overColumnId) {
            // Find insertion index
            let insertIndex = col.tasks.length;
            if (overData?.type === "task") {
              const overTaskIndex = col.tasks.findIndex(
                (t) => t.id === over.id
              );
              if (overTaskIndex !== -1) insertIndex = overTaskIndex;
            }
            const newTasks = [...col.tasks];
            newTasks.splice(insertIndex, 0, {
              ...task,
              column_id: overColumnId,
            });
            return { ...col, tasks: newTasks };
          }
          return col;
        });
      });

      // Update the active task's column reference for further drag operations
      if (active.data.current) {
        active.data.current.columnId = overColumnId;
      }
    },
    []
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const activeData = active.data.current;
      if (!activeData || activeData.type !== "task") return;

      const activeColumnId = activeData.columnId as string;

      // Find the task in the current (optimistic) state
      const col = columns.find((c) => c.id === activeColumnId);
      if (!col) return;

      const taskIndex = col.tasks.findIndex((t) => t.id === active.id);
      if (taskIndex === -1) return;

      // Calculate position based on neighbors
      let newPosition: number;
      if (col.tasks.length === 1) {
        newPosition = 0;
      } else if (taskIndex === 0) {
        newPosition = col.tasks[1].position - POSITION_GAP;
      } else if (taskIndex === col.tasks.length - 1) {
        newPosition = col.tasks[taskIndex - 1].position + POSITION_GAP;
      } else {
        newPosition = Math.round(
          (col.tasks[taskIndex - 1].position +
            col.tasks[taskIndex + 1].position) /
            2
        );
      }

      try {
        await moveBoardTask(
          String(active.id),
          ideaId,
          activeColumnId,
          newPosition
        );
      } catch {
        // Revert on error - server refresh will fix state
        setColumns(initialColumns);
      }
    },
    [columns, ideaId, initialColumns]
  );

  const columnIds = columns.map((c) => `column-${c.id}`);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        <SortableContext
          items={columnIds}
          strategy={horizontalListSortingStrategy}
        >
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              ideaId={ideaId}
              teamMembers={teamMembers}
            />
          ))}
        </SortableContext>
        <AddColumnButton ideaId={ideaId} />
      </div>
      <DragOverlay>
        {activeTask && (
          <div className="w-[280px] rounded-md border border-primary bg-background p-3 shadow-lg">
            <p className="text-sm font-medium">{activeTask.title}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
