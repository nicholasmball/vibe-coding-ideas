"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  pointerWithin,
  closestCenter,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import React from "react";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import Link from "next/link";
import { Eye, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BoardColumn } from "./board-column";
import { AddColumnButton } from "./add-column-button";
import { BoardToolbar } from "./board-toolbar";
import { BoardOpsContext, type BoardOptimisticOps } from "./board-context";
import { toast } from "sonner";
import { moveBoardTask, reorderBoardColumns } from "@/actions/board";
import { POSITION_GAP } from "@/lib/constants";
import { getDueDateStatus } from "@/lib/utils";
import type {
  BoardColumnWithTasks,
  BoardTaskWithAssignee,
  BoardColumn as BoardColumnType,
  BoardLabel,
  BoardChecklistItem,
  User,
  BotProfile,
  AiCredits,
} from "@/types";

// Custom collision detection: pointerWithin finds the column, closestCenter picks task position
const multiContainerCollision: CollisionDetection = (args) => {
  // First check if pointer is within any droppable (columns)
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  // Fallback to closestCenter for edge cases (fast moves, keyboard nav)
  return closestCenter(args);
};

const layoutMeasuring = {
  droppable: { strategy: MeasuringStrategy.WhileDragging },
};

// Memoized overlay — prevents parent re-renders from cascading on every drag frame
const OverlayContent = React.memo(function OverlayContent({
  activeTask,
  activeColumn,
}: {
  activeTask: BoardTaskWithAssignee | null;
  activeColumn: BoardColumnWithTasks | null;
}) {
  if (activeTask) {
    return (
      <div className="w-[280px] rounded-md border border-primary bg-background p-3 shadow-lg">
        <p className="text-sm font-medium">{activeTask.title}</p>
      </div>
    );
  }
  if (activeColumn) {
    return (
      <div className="w-[280px] rounded-lg border border-primary bg-muted/50 p-3 shadow-lg opacity-80">
        <p className="text-sm font-semibold">{activeColumn.title}</p>
        <p className="text-xs text-muted-foreground">
          {activeColumn.tasks.filter((t) => !t.archived).length} tasks
        </p>
      </div>
    );
  }
  return null;
});

interface KanbanBoardProps {
  columns: BoardColumnWithTasks[];
  ideaId: string;
  ideaDescription?: string;
  teamMembers: User[];
  boardLabels: BoardLabel[];
  checklistItemsByTaskId: Record<string, BoardChecklistItem[]>;
  currentUserId: string;
  initialTaskId?: string;
  userBots?: User[];
  aiEnabled?: boolean;
  botProfiles?: BotProfile[];
  aiCredits?: AiCredits | null;
  coverImageUrls?: Record<string, string>;
  isReadOnly?: boolean;
}

export function KanbanBoard({
  columns: initialColumns,
  ideaId,
  ideaDescription = "",
  teamMembers,
  boardLabels,
  checklistItemsByTaskId,
  currentUserId,
  initialTaskId,
  userBots = [],
  aiEnabled = false,
  botProfiles = [],
  aiCredits,
  coverImageUrls = {},
  isReadOnly = false,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns);
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const [activeTask, setActiveTask] = useState<BoardTaskWithAssignee | null>(
    null
  );
  const [activeColumn, setActiveColumn] =
    useState<BoardColumnWithTasks | null>(null);
  const dragSourceColumnRef = useRef<string | null>(null);
  const dragCurrentColumnRef = useRef<string | null>(null);
  const lastOverColumnRef = useRef<string | null>(null);
  // Snapshot of columns at drag start — used for immediate revert on cancel
  const dragStartColumnsRef = useRef<BoardColumnWithTasks[] | null>(null);

  // Track in-flight move operations to prevent server data from reverting optimistic updates
  const [pendingOps, setPendingOps] = useState(0);
  // Cooldown after last move to let Realtime catch up before syncing
  const lastMoveTimeRef = useRef(0);
  const MOVE_COOLDOWN_MS = 1500;

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState<string[]>([]);
  const [dueDateFilter, setDueDateFilter] = useState("all");
  const [showArchived, setShowArchived] = useState(false);

  // Scroll indicator state (mobile)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const handleScrollCheck = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);
  useEffect(() => {
    handleScrollCheck();
    window.addEventListener("resize", handleScrollCheck);
    return () => window.removeEventListener("resize", handleScrollCheck);
  }, [handleScrollCheck, columns]);

  // Update columns when server data changes (via realtime refresh)
  const serverKey = useMemo(
    () =>
      JSON.stringify(
        initialColumns.map((c) => [
          c.id,
          c.position,
          c.is_done_column,
          c.tasks.map((t) => [
            t.id,
            t.labels.map((l) => l.id).sort(),
            t.due_date,
            t.checklist_total,
            t.checklist_done,
            t.assignee_id,
            t.title,
            t.description,
            t.archived,
            t.attachment_count,
            t.comment_count,
            t.cover_image_path,
          ]),
        ])
      ),
    [initialColumns]
  );
  const [lastServerKey, setLastServerKey] = useState(serverKey);
  // Keep refs for deferred sync callback
  const initialColumnsRef = useRef(initialColumns);
  initialColumnsRef.current = initialColumns;
  const serverKeyRef = useRef(serverKey);
  serverKeyRef.current = serverKey;

  // Fast-path sync when no recent moves
  const withinCooldown = Date.now() - lastMoveTimeRef.current < MOVE_COOLDOWN_MS;
  if (serverKey !== lastServerKey && !activeTask && !activeColumn && pendingOps === 0 && !withinCooldown) {
    setColumns(initialColumns);
    setLastServerKey(serverKey);
  }

  // Deferred sync: wait for cooldown to expire after rapid moves
  const needsDeferredSync = serverKey !== lastServerKey && !activeTask && !activeColumn && pendingOps === 0 && withinCooldown;
  useEffect(() => {
    if (!needsDeferredSync) return;
    const remaining = MOVE_COOLDOWN_MS - (Date.now() - lastMoveTimeRef.current);
    if (remaining <= 0) {
      setColumns(initialColumnsRef.current);
      setLastServerKey(serverKeyRef.current);
      return;
    }
    const timer = setTimeout(() => {
      setColumns(initialColumnsRef.current);
      setLastServerKey(serverKeyRef.current);
    }, remaining + 100);
    return () => clearTimeout(timer);
  }, [needsDeferredSync]);

  // Count archived tasks across all columns
  const archivedCount = useMemo(
    () =>
      columns.reduce(
        (acc, col) =>
          acc +
          col.tasks.filter((t) => t.archived).length,
        0
      ),
    [columns]
  );

  // ────────────────────────────────────────────────────
  // Optimistic operation callbacks (exposed via context)
  // ────────────────────────────────────────────────────

  const optimisticCreateTask = useCallback(
    (columnId: string, tempTask: BoardTaskWithAssignee) => {
      const prev = columnsRef.current;
      setColumns((cols) => {
        const next = cols.map((col) =>
          col.id === columnId
            ? { ...col, tasks: [...col.tasks, tempTask] }
            : col
        );
        columnsRef.current = next;
        return next;
      });
      return () => {
        setColumns(prev);
        columnsRef.current = prev;
      };
    },
    []
  );

  const optimisticDeleteTask = useCallback(
    (taskId: string, columnId: string) => {
      const prev = columnsRef.current;
      setColumns((cols) => {
        const next = cols.map((col) =>
          col.id === columnId
            ? { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
            : col
        );
        columnsRef.current = next;
        return next;
      });
      return () => {
        setColumns(prev);
        columnsRef.current = prev;
      };
    },
    []
  );

  const optimisticCreateColumn = useCallback(
    (tempColumn: BoardColumnWithTasks) => {
      const prev = columnsRef.current;
      setColumns((cols) => {
        const next = [...cols, tempColumn];
        columnsRef.current = next;
        return next;
      });
      return () => {
        setColumns(prev);
        columnsRef.current = prev;
      };
    },
    []
  );

  const optimisticDeleteColumn = useCallback(
    (columnId: string) => {
      const prev = columnsRef.current;
      setColumns((cols) => {
        const next = cols.filter((c) => c.id !== columnId);
        columnsRef.current = next;
        return next;
      });
      return () => {
        setColumns(prev);
        columnsRef.current = prev;
      };
    },
    []
  );

  const optimisticUpdateColumn = useCallback(
    (columnId: string, updates: Partial<BoardColumnType>) => {
      const prev = columnsRef.current;
      setColumns((cols) => {
        const next = cols.map((col) =>
          col.id === columnId ? { ...col, ...updates } : col
        );
        columnsRef.current = next;
        return next;
      });
      return () => {
        setColumns(prev);
        columnsRef.current = prev;
      };
    },
    []
  );

  const optimisticArchiveColumnTasks = useCallback(
    (columnId: string) => {
      const prev = columnsRef.current;
      setColumns((cols) => {
        const next = cols.map((col) =>
          col.id === columnId
            ? {
                ...col,
                tasks: col.tasks.map((t) =>
                  t.archived ? t : { ...t, archived: true }
                ),
              }
            : col
        );
        columnsRef.current = next;
        return next;
      });
      return () => {
        setColumns(prev);
        columnsRef.current = prev;
      };
    },
    []
  );

  const incrementPendingOps = useCallback(() => {
    setPendingOps((n) => n + 1);
  }, []);

  const decrementPendingOps = useCallback(() => {
    setPendingOps((n) => n - 1);
    lastMoveTimeRef.current = Date.now();
  }, []);

  const boardOps = useMemo<BoardOptimisticOps>(
    () => ({
      createTask: optimisticCreateTask,
      deleteTask: optimisticDeleteTask,
      createColumn: optimisticCreateColumn,
      deleteColumn: optimisticDeleteColumn,
      updateColumn: optimisticUpdateColumn,
      archiveColumnTasks: optimisticArchiveColumnTasks,
      incrementPendingOps,
      decrementPendingOps,
    }),
    [
      optimisticCreateTask,
      optimisticDeleteTask,
      optimisticCreateColumn,
      optimisticDeleteColumn,
      optimisticUpdateColumn,
      optimisticArchiveColumnTasks,
      incrementPendingOps,
      decrementPendingOps,
    ]
  );

  // Derive filtered columns (preserves object references for unchanged columns)
  const filteredColumns = useMemo(() => {
    return columns.map((col) => {
      const filtered = col.tasks.filter((task) => {
        // Archived filter
        if (task.archived && !showArchived) return false;

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
      });
      // Preserve reference when no tasks were filtered out
      return filtered.length === col.tasks.length ? col : { ...col, tasks: filtered };
    });
  }, [
    columns,
    searchQuery,
    assigneeFilter,
    labelFilter,
    dueDateFilter,
    showArchived,
  ]);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(mouseSensor, touchSensor, keyboardSensor);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const data = active.data.current;

      // Snapshot columns so we can revert immediately if drag is cancelled
      dragStartColumnsRef.current = columnsRef.current;

      if (data?.type === "column") {
        const col = columnsRef.current.find((c) => c.id === data.columnId);
        if (col) setActiveColumn(col);
      } else {
        const colId = (data?.columnId as string) ?? null;
        // Look up the task from columns state (sortableData no longer carries it)
        if (colId) {
          const col = columnsRef.current.find((c) => c.id === colId);
          const task = col?.tasks.find((t) => t.id === active.id);
          if (task) setActiveTask(task);
        }
        dragSourceColumnRef.current = colId;
        dragCurrentColumnRef.current = colId;
      }
    },
    []
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;
      if (!activeData || activeData.type !== "task") return;

      // Use our ref for the current column (never mutate active.data)
      const activeColumnId = dragCurrentColumnRef.current;
      if (!activeColumnId) return;

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

      // Skip if we already moved the task to this column
      if (overColumnId === lastOverColumnRef.current) return;
      lastOverColumnRef.current = overColumnId;

      // Update our tracking ref (replaces mutating active.data.current)
      dragCurrentColumnRef.current = overColumnId;

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

        const next = prev.map((col) => {
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
        columnsRef.current = next;
        return next;
      });
    },
    []
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const activeData = active.data.current;
      const currentColumns = columnsRef.current;

      lastOverColumnRef.current = null;

      // Column drag end
      if (activeData?.type === "column") {
        setActiveColumn(null);
        if (!over) {
          dragStartColumnsRef.current = null;
          return;
        }

        const activeId = activeData.columnId as string;
        const overId = over.data.current?.columnId as string | undefined;
        if (!overId || activeId === overId) return;

        const oldIndex = currentColumns.findIndex((c) => c.id === activeId);
        const newIndex = currentColumns.findIndex((c) => c.id === overId);
        if (oldIndex === -1 || newIndex === -1) return;

        const newColumns = arrayMove(currentColumns, oldIndex, newIndex);
        columnsRef.current = newColumns;
        setColumns(newColumns);

        setPendingOps((n) => n + 1);
        try {
          await reorderBoardColumns(
            ideaId,
            newColumns.map((c) => c.id)
          );
        } catch {
          toast.error("Failed to reorder columns");
          setLastServerKey(""); // force re-sync when pendingOps reaches 0
        } finally {
          setPendingOps((n) => n - 1);
          lastMoveTimeRef.current = Date.now();
        }
        return;
      }

      // Task drag end — read current column from our ref (not active.data)
      setActiveTask(null);

      const currentColumnId = dragCurrentColumnRef.current;
      const movedBetweenColumns = dragSourceColumnRef.current !== currentColumnId;

      // Clean up refs
      dragCurrentColumnRef.current = null;

      // Dropped on nothing — revert to pre-drag state immediately
      if (!over || !activeData || activeData.type !== "task") {
        if (dragStartColumnsRef.current) {
          const snapshot = dragStartColumnsRef.current;
          setColumns(snapshot);
          columnsRef.current = snapshot;
        }
        dragStartColumnsRef.current = null;
        return;
      }

      // Clear snapshot — this was a valid drop, no revert needed
      dragStartColumnsRef.current = null;

      const activeColumnId = currentColumnId ?? (activeData.columnId as string);
      const col = currentColumns.find((c) => c.id === activeColumnId);
      if (!col) {
        return;
      }

      const activeIndex = col.tasks.findIndex((t) => t.id === active.id);
      if (activeIndex === -1) {
        return;
      }

      // Determine the target index from the over item
      const overData = over.data.current;
      let overIndex: number;
      if (overData?.type === "task") {
        overIndex = col.tasks.findIndex((t) => t.id === over.id);
        if (overIndex === -1) overIndex = activeIndex;
      } else {
        // Dropped on column droppable (empty area) — keep current spot
        overIndex = activeIndex;
      }

      // If same-column reorder with no position change, nothing to persist
      if (!movedBetweenColumns && activeIndex === overIndex) {
        return;
      }

      // Reorder the task list optimistically (handles same-column reorder)
      const reordered = arrayMove(col.tasks, activeIndex, overIndex);
      setColumns((prev) => {
        const next = prev.map((c) =>
          c.id === activeColumnId ? { ...c, tasks: reordered } : c
        );
        columnsRef.current = next;
        return next;
      });

      // Calculate position based on the reordered array
      const taskIndex = overIndex;
      let newPosition: number;
      if (reordered.length === 1) {
        newPosition = 0;
      } else if (taskIndex === 0) {
        newPosition = reordered[1].position - POSITION_GAP;
      } else if (taskIndex === reordered.length - 1) {
        newPosition = reordered[taskIndex - 1].position + POSITION_GAP;
      } else {
        newPosition = Math.round(
          (reordered[taskIndex - 1].position +
            reordered[taskIndex + 1].position) /
            2
        );
      }

      setPendingOps((n) => n + 1);
      try {
        await moveBoardTask(
          String(active.id),
          ideaId,
          activeColumnId,
          newPosition
        );
      } catch {
        toast.error("Failed to move task");
        setLastServerKey(""); // force re-sync when pendingOps reaches 0
      } finally {
        setPendingOps((n) => n - 1);
        lastMoveTimeRef.current = Date.now();
      }
    },
    [ideaId]
  );

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  return (
    <BoardOpsContext.Provider value={boardOps}>
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Guest banner */}
      {isReadOnly && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            You&apos;re viewing this board as a guest
          </div>
          <Link href={`/ideas/${ideaId}`}>
            <Button size="sm" className="gap-1.5">
              <UserPlus className="h-3.5 w-3.5" />
              Request to Collaborate
            </Button>
          </Link>
        </div>
      )}
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
        columns={columns}
        ideaId={ideaId}
        ideaDescription={ideaDescription}
        currentUserId={currentUserId}
        aiEnabled={aiEnabled}
        botProfiles={botProfiles}
        aiCredits={aiCredits}
        isReadOnly={isReadOnly}
      />
      <DndContext
        sensors={isReadOnly ? [] : sensors}
        collisionDetection={multiContainerCollision}
        measuring={layoutMeasuring}
        onDragStart={isReadOnly ? undefined : handleDragStart}
        onDragOver={isReadOnly ? undefined : handleDragOver}
        onDragEnd={isReadOnly ? undefined : handleDragEnd}
      >
        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollContainerRef}
            onScroll={handleScrollCheck}
            className="flex h-full items-start gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:snap-none"
          >
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
                    totalTaskCount={fullCol.tasks.filter((t) => !t.archived).length}
                    ideaId={ideaId}
                    teamMembers={teamMembers}
                    boardLabels={boardLabels}
                    checklistItemsByTaskId={checklistItemsByTaskId}
                    highlightQuery={searchQuery}
                    currentUserId={currentUserId}
                    initialTaskId={initialTaskId}
                    userBots={userBots}
                    coverImageUrls={coverImageUrls}
                    aiEnabled={aiEnabled}
                    aiCredits={aiCredits}
                    ideaDescription={ideaDescription}
                    isReadOnly={isReadOnly}
                  />
                );
              })}
            </SortableContext>
            {!isReadOnly && <AddColumnButton ideaId={ideaId} />}
          </div>
          {/* Right-edge fade gradient — visible on mobile when more columns exist off-screen */}
          {canScrollRight && (
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent sm:hidden" />
          )}
        </div>
        {!isReadOnly && (
          <DragOverlay dropAnimation={null}>
            <OverlayContent activeTask={activeTask} activeColumn={activeColumn} />
          </DragOverlay>
        )}
      </DndContext>
    </div>
    </BoardOpsContext.Provider>
  );
}
