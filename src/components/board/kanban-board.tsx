"use client";

import { useState, useCallback, useMemo } from "react";
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
  arrayMove,
} from "@dnd-kit/sortable";
import { BoardColumn } from "./board-column";
import { AddColumnButton } from "./add-column-button";
import { BoardToolbar } from "./board-toolbar";
import { moveBoardTask, reorderBoardColumns } from "@/actions/board";
import { POSITION_GAP } from "@/lib/constants";
import { getDueDateStatus } from "@/lib/utils";
import type {
  BoardColumnWithTasks,
  BoardTaskWithAssignee,
  BoardLabel,
  BoardChecklistItem,
  User,
} from "@/types";

interface KanbanBoardProps {
  columns: BoardColumnWithTasks[];
  ideaId: string;
  teamMembers: User[];
  boardLabels: BoardLabel[];
  checklistItemsByTaskId: Record<string, BoardChecklistItem[]>;
  currentUserId: string;
}

export function KanbanBoard({
  columns: initialColumns,
  ideaId,
  teamMembers,
  boardLabels,
  checklistItemsByTaskId,
  currentUserId,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [activeTask, setActiveTask] = useState<BoardTaskWithAssignee | null>(
    null
  );
  const [activeColumn, setActiveColumn] =
    useState<BoardColumnWithTasks | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState<string[]>([]);
  const [dueDateFilter, setDueDateFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  // Update columns when server data changes (via realtime refresh)
  const serverKey = JSON.stringify(
    initialColumns.map((c) => [
      c.id,
      c.position,
      c.tasks.map((t) => [
        t.id,
        t.labels.map((l) => l.id).sort(),
        t.due_date,
        t.checklist_total,
        t.checklist_done,
        t.assignee_id,
        t.title,
        (t as BoardTaskWithAssignee & { archived?: boolean }).archived,
        (t as BoardTaskWithAssignee & { attachment_count?: number })
          .attachment_count,
        (t as BoardTaskWithAssignee & { cover_image_path?: string | null })
          .cover_image_path,
      ]),
    ])
  );
  const [lastServerKey, setLastServerKey] = useState(serverKey);
  if (serverKey !== lastServerKey && !activeTask && !activeColumn) {
    setColumns(initialColumns);
    setLastServerKey(serverKey);
  }

  // Count archived tasks across all columns
  const archivedCount = useMemo(
    () =>
      columns.reduce(
        (acc, col) =>
          acc +
          col.tasks.filter(
            (t) =>
              (t as BoardTaskWithAssignee & { archived?: boolean }).archived
          ).length,
        0
      ),
    [columns]
  );

  // Derive filtered columns
  const filteredColumns = useMemo(() => {
    return columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((task) => {
        // Archived filter
        const isArchived = (
          task as BoardTaskWithAssignee & { archived?: boolean }
        ).archived;
        if (isArchived && !showArchived) return false;

        // Search filter
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = task.title.toLowerCase().includes(q);
          const matchesDesc = task.description?.toLowerCase().includes(q);
          if (!matchesTitle && !matchesDesc) return false;
        }

        // Assignee filter
        if (assigneeFilter === "unassigned" && task.assignee_id) return false;
        if (
          assigneeFilter !== "all" &&
          assigneeFilter !== "unassigned" &&
          task.assignee_id !== assigneeFilter
        )
          return false;

        // Label filter (task must have ALL selected labels)
        if (labelFilter.length > 0) {
          const taskLabelIds = task.labels.map((l) => l.id);
          if (!labelFilter.every((id) => taskLabelIds.includes(id)))
            return false;
        }

        // Due date filter
        if (dueDateFilter !== "all" && task.due_date) {
          const status = getDueDateStatus(task.due_date);
          if (dueDateFilter === "overdue" && status !== "overdue") return false;
          if (dueDateFilter === "due_soon" && status !== "due_soon")
            return false;
        } else if (dueDateFilter !== "all" && !task.due_date) {
          return false;
        }

        return true;
      }),
    }));
  }, [
    columns,
    searchQuery,
    assigneeFilter,
    labelFilter,
    dueDateFilter,
    showArchived,
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const data = active.data.current;

      if (data?.type === "column") {
        const col = columns.find((c) => c.id === data.columnId);
        if (col) setActiveColumn(col);
      } else {
        const task = data?.task as BoardTaskWithAssignee | undefined;
        if (task) setActiveTask(task);
      }
    },
    [columns]
  );

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

      if (active.data.current) {
        active.data.current.columnId = overColumnId;
      }
    },
    []
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const activeData = active.data.current;

      // Column drag end
      if (activeData?.type === "column") {
        setActiveColumn(null);
        if (!over) return;

        const activeId = activeData.columnId as string;
        const overId = over.data.current?.columnId as string | undefined;
        if (!overId || activeId === overId) return;

        const oldIndex = columns.findIndex((c) => c.id === activeId);
        const newIndex = columns.findIndex((c) => c.id === overId);
        if (oldIndex === -1 || newIndex === -1) return;

        const newColumns = arrayMove(columns, oldIndex, newIndex);
        setColumns(newColumns);

        try {
          await reorderBoardColumns(
            ideaId,
            newColumns.map((c) => c.id)
          );
        } catch {
          setColumns(initialColumns);
        }
        return;
      }

      // Task drag end
      setActiveTask(null);

      if (!over) return;
      if (!activeData || activeData.type !== "task") return;

      const activeColumnId = activeData.columnId as string;
      const col = columns.find((c) => c.id === activeColumnId);
      if (!col) return;

      const taskIndex = col.tasks.findIndex((t) => t.id === active.id);
      if (taskIndex === -1) return;

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
        setColumns(initialColumns);
      }
    },
    [columns, ideaId, initialColumns]
  );

  const columnIds = columns.map((c) => c.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <BoardToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        assigneeFilter={assigneeFilter}
        onAssigneeChange={setAssigneeFilter}
        labelFilter={labelFilter}
        onLabelFilterChange={setLabelFilter}
        dueDateFilter={dueDateFilter}
        onDueDateChange={setDueDateFilter}
        teamMembers={teamMembers}
        boardLabels={boardLabels}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
        archivedCount={archivedCount}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex min-h-0 flex-1 items-start gap-4 overflow-x-auto pb-4">
          <SortableContext
            items={columnIds}
            strategy={horizontalListSortingStrategy}
          >
            {filteredColumns.map((filteredCol) => {
              const fullCol = columns.find((c) => c.id === filteredCol.id)!;
              return (
                <BoardColumn
                  key={filteredCol.id}
                  column={filteredCol}
                  totalTaskCount={fullCol.tasks.length}
                  ideaId={ideaId}
                  teamMembers={teamMembers}
                  boardLabels={boardLabels}
                  checklistItemsByTaskId={checklistItemsByTaskId}
                  highlightQuery={searchQuery}
                  currentUserId={currentUserId}
                />
              );
            })}
          </SortableContext>
          <AddColumnButton ideaId={ideaId} />
        </div>
        <DragOverlay>
          {activeTask && (
            <div className="w-[280px] rounded-md border border-primary bg-background p-3 shadow-lg">
              <p className="text-sm font-medium">{activeTask.title}</p>
            </div>
          )}
          {activeColumn && (
            <div className="w-[280px] rounded-lg border border-primary bg-muted/50 p-3 shadow-lg opacity-80">
              <p className="text-sm font-semibold">{activeColumn.title}</p>
              <p className="text-xs text-muted-foreground">
                {activeColumn.tasks.length} tasks
              </p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
