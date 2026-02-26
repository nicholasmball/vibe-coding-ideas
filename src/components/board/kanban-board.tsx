"use client";

import { useState, useCallback, useMemo, useRef, useEffect, createContext } from "react";
import { DragDropContext, Droppable, type DropResult } from "@happy-doc/dnd";
import React from "react";
import { useSearchParams } from "next/navigation";
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
} from "@/types";

// Context for auto-open state — bypasses memo chain so task cards can react to URL navigation
export const TaskAutoOpenContext = createContext<{
  autoOpenTaskId: string | undefined;
  onAutoOpenConsumed: () => void;
}>({ autoOpenTaskId: undefined, onAutoOpenConsumed: () => {} });

function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = [...array];
  const [removed] = newArray.splice(from, 1);
  newArray.splice(to, 0, removed);
  return newArray;
}

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
  hasApiKey?: boolean;
  botProfiles?: BotProfile[];
  coverImageUrls?: Record<string, string>;
  isReadOnly?: boolean;
  isTestMode?: boolean;
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
  hasApiKey = false,
  botProfiles = [],
  coverImageUrls = {},
  isReadOnly = false,
  isTestMode = false,
}: KanbanBoardProps) {
  // react-beautiful-dnd (and forks like @happy-doc/dnd) need a mounted DOM before
  // Droppable can measure. React 18+ strict mode double-mounts cause "Invariant failed".
  // Deferring render to after mount fixes this.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  // Auto-open: detect taskId from URL navigation (Link clicks) as well as server props.
  // useSearchParams reacts to Link navigations, which may not propagate through server
  // props when the board is already mounted (memo chain can block the update).
  const searchParams = useSearchParams();
  const urlTaskId = searchParams.get("taskId") ?? undefined;
  const [autoOpenTaskId, setAutoOpenTaskId] = useState<string | undefined>(initialTaskId);

  // Sync with server-provided initialTaskId (handles initial page load)
  useEffect(() => {
    if (initialTaskId) {
      setAutoOpenTaskId(initialTaskId);
    }
  }, [initialTaskId]);

  // Sync with URL changes from client-side Link navigations (notification clicks)
  useEffect(() => {
    if (urlTaskId) {
      setAutoOpenTaskId(urlTaskId);
    }
  }, [urlTaskId]);

  // Clear auto-open state once the dialog has been opened and then closed
  const handleAutoOpenConsumed = useCallback(() => {
    setAutoOpenTaskId(undefined);
  }, []);

  const autoOpenCtx = useMemo(
    () => ({ autoOpenTaskId, onAutoOpenConsumed: handleAutoOpenConsumed }),
    [autoOpenTaskId, handleAutoOpenConsumed]
  );

  const [columns, setColumns] = useState(initialColumns);
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  // isDragging state — used to disable snap scroll during drag
  const [isDragging, setIsDragging] = useState(false);
  // Which column the pointer is currently over during a drag (for visual highlight)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const dragOverColumnRef = useRef<string | null>(null);

  // Track last pointer/touch position during drag — used to detect actual drop
  // target when the library's scroll tracking fails for off-screen columns.
  // We use capture phase + passive listeners to ensure we get coordinates even
  // when the DnD library calls preventDefault on the events.
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!isDragging) { lastPointerRef.current = null; return; }
    const update = (x: number, y: number) => { lastPointerRef.current = { x, y }; };
    const onPointer = (e: PointerEvent) => { update(e.clientX, e.clientY); };
    const onMouse = (e: MouseEvent) => { update(e.clientX, e.clientY); };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0] ?? e.changedTouches[0];
      if (t) update(t.clientX, t.clientY);
    };
    // Use capture: true to get events before the library can consume them
    window.addEventListener("pointermove", onPointer, { capture: true, passive: true });
    window.addEventListener("mousemove", onMouse, { capture: true, passive: true });
    window.addEventListener("touchmove", onTouch, { capture: true, passive: true });
    window.addEventListener("touchend", onTouch, { capture: true, passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointer, { capture: true });
      window.removeEventListener("mousemove", onMouse, { capture: true });
      window.removeEventListener("touchmove", onTouch, { capture: true });
      window.removeEventListener("touchend", onTouch, { capture: true });
    };
  }, [isDragging]);

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

  // Auto-scroll + drag-over highlight: runs a rAF loop during drag that
  // (1) scrolls the board when dragging near edges, and
  // (2) detects which column the pointer is over for visual feedback.
  useEffect(() => {
    if (!isDragging) {
      if (dragOverColumnRef.current) {
        dragOverColumnRef.current = null;
        setDragOverColumnId(null);
      }
      return;
    }

    const EDGE = 120;
    const MAX_SPEED = 30;
    let raf = 0;

    const loop = () => {
      const el = scrollContainerRef.current;
      const pos = lastPointerRef.current;
      if (el && pos) {
        // Edge scrolling
        const rect = el.getBoundingClientRect();
        if (pos.x > rect.right - EDGE) {
          const t = Math.min(1, (pos.x - (rect.right - EDGE)) / EDGE);
          el.scrollLeft += MAX_SPEED * (0.2 + t * 0.8);
        } else if (pos.x < rect.left + EDGE) {
          const t = Math.min(1, ((rect.left + EDGE) - pos.x) / EDGE);
          el.scrollLeft -= MAX_SPEED * (0.2 + t * 0.8);
        }

        // Detect column under pointer for highlight
        let hoveredCol: string | null = null;
        const columnEls = document.querySelectorAll<HTMLElement>("[data-column-id]");
        for (const colEl of columnEls) {
          const colRect = colEl.getBoundingClientRect();
          if (pos.x >= colRect.left && pos.x <= colRect.right && pos.y >= colRect.top && pos.y <= colRect.bottom) {
            hoveredCol = colEl.dataset.columnId ?? null;
            break;
          }
        }
        // Fallback: closest column if within board vertical bounds
        if (!hoveredCol && pos.y >= rect.top && pos.y <= rect.bottom) {
          let closest: { id: string; dist: number } | null = null;
          for (const colEl of columnEls) {
            const colRect = colEl.getBoundingClientRect();
            const centerX = (colRect.left + colRect.right) / 2;
            const dist = Math.abs(pos.x - centerX);
            if (!closest || dist < closest.dist) {
              closest = { id: colEl.dataset.columnId!, dist };
            }
          }
          hoveredCol = closest?.id ?? null;
        }
        // Only update state when the hovered column changes (avoids re-renders)
        if (hoveredCol !== dragOverColumnRef.current) {
          dragOverColumnRef.current = hoveredCol;
          setDragOverColumnId(hoveredCol);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(raf); };
  }, [isDragging]);

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
  if (serverKey !== lastServerKey && !isDragging && pendingOps === 0 && !withinCooldown) {
    setColumns(initialColumns);
    setLastServerKey(serverKey);
  }

  // Deferred sync: wait for cooldown to expire after rapid moves
  const needsDeferredSync =
    serverKey !== lastServerKey && !isDragging && pendingOps === 0 && withinCooldown;
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
    () => columns.reduce((acc, col) => acc + col.tasks.filter((t) => t.archived).length, 0),
    [columns]
  );

  // ────────────────────────────────────────────────────
  // Optimistic operation callbacks (exposed via context)
  // ────────────────────────────────────────────────────

  const optimisticCreateTask = useCallback((columnId: string, tempTask: BoardTaskWithAssignee) => {
    const prev = columnsRef.current;
    setColumns((cols) => {
      const next = cols.map((col) => (col.id === columnId ? { ...col, tasks: [...col.tasks, tempTask] } : col));
      columnsRef.current = next;
      return next;
    });
    return () => {
      setColumns(prev);
      columnsRef.current = prev;
    };
  }, []);

  const optimisticDeleteTask = useCallback((taskId: string, columnId: string) => {
    const prev = columnsRef.current;
    setColumns((cols) => {
      const next = cols.map((col) =>
        col.id === columnId ? { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) } : col
      );
      columnsRef.current = next;
      return next;
    });
    return () => {
      setColumns(prev);
      columnsRef.current = prev;
    };
  }, []);

  const optimisticCreateColumn = useCallback((tempColumn: BoardColumnWithTasks) => {
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
  }, []);

  const optimisticDeleteColumn = useCallback((columnId: string) => {
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
  }, []);

  const optimisticUpdateColumn = useCallback((columnId: string, updates: Partial<BoardColumnType>) => {
    const prev = columnsRef.current;
    setColumns((cols) => {
      const next = cols.map((col) => (col.id === columnId ? { ...col, ...updates } : col));
      columnsRef.current = next;
      return next;
    });
    return () => {
      setColumns(prev);
      columnsRef.current = prev;
    };
  }, []);

  const optimisticArchiveColumnTasks = useCallback((columnId: string) => {
    const prev = columnsRef.current;
    setColumns((cols) => {
      const next = cols.map((col) =>
        col.id === columnId
          ? {
              ...col,
              tasks: col.tasks.map((t) => (t.archived ? t : { ...t, archived: true })),
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
  }, []);

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
        if (assigneeFilter !== "all" && assigneeFilter !== "unassigned" && task.assignee_id !== assigneeFilter)
          return false;

        // Label filter (task must have ALL selected labels)
        if (labelFilter.length > 0) {
          const taskLabelIds = task.labels.map((l) => l.id);
          if (!labelFilter.every((id) => taskLabelIds.includes(id))) return false;
        }

        // Due date filter
        if (dueDateFilter !== "all" && task.due_date) {
          const status = getDueDateStatus(task.due_date);
          if (dueDateFilter === "overdue" && status !== "overdue") return false;
          if (dueDateFilter === "due_soon" && status !== "due_soon") return false;
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

  // Detect which column the pointer is actually over by checking bounding rects
  // of all column elements. This is more reliable than elementsFromPoint which
  // can be blocked by drag overlays on mobile.
  const detectColumnUnderPointer = useCallback((): string | null => {
    const pos = lastPointerRef.current;
    if (!pos) return null;
    const columnEls = document.querySelectorAll<HTMLElement>("[data-column-id]");
    for (const el of columnEls) {
      const rect = el.getBoundingClientRect();
      if (pos.x >= rect.left && pos.x <= rect.right && pos.y >= rect.top && pos.y <= rect.bottom) {
        return el.dataset.columnId ?? null;
      }
    }
    // Fallback: if pointer is within the board's vertical bounds, find the
    // closest column horizontally (handles gaps between columns)
    const container = scrollContainerRef.current;
    if (!container) return null;
    const containerRect = container.getBoundingClientRect();
    if (pos.y < containerRect.top || pos.y > containerRect.bottom) return null;
    let closest: { id: string; dist: number } | null = null;
    for (const el of columnEls) {
      const rect = el.getBoundingClientRect();
      const centerX = (rect.left + rect.right) / 2;
      const dist = Math.abs(pos.x - centerX);
      if (!closest || dist < closest.dist) {
        closest = { id: el.dataset.columnId!, dist };
      }
    }
    return closest?.id ?? null;
  }, []);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      setIsDragging(false);

      const { source, type } = result;
      let { destination } = result;

      // The library's scroll tracking often fails for off-screen columns that
      // were scrolled into view programmatically. Use bounding-rect detection
      // to find the actual column under the pointer and override if needed.
      if (type === "TASK") {
        const actualColumnId = detectColumnUnderPointer();
        if (actualColumnId) {
          // Always trust the DOM-detected column over the library's destination
          if (!destination || destination.droppableId !== actualColumnId) {
            const targetCol = columnsRef.current.find(c => c.id === actualColumnId);
            destination = {
              droppableId: actualColumnId,
              index: targetCol ? targetCol.tasks.length : 0, // append to end
            };
          }
        }
      }

      // Dropped outside a valid droppable
      if (!destination) return;

      // No movement
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) return;

      const currentColumns = columnsRef.current;

      if (type === "COLUMN") {
        // Column reorder
        const oldIndex = source.index;
        const newIndex = destination.index;

        const newColumns = arrayMove(currentColumns, oldIndex, newIndex);
        columnsRef.current = newColumns;
        setColumns(newColumns);

        if (!isTestMode) {
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
        }
        return;
      }

      // Task move — type === "TASK" (same column reorder or cross-column move)
      const sourceColumnId = source.droppableId;
      const destColumnId = destination.droppableId;

      const sourceCol = currentColumns.find((c) => c.id === sourceColumnId);
      const destCol = currentColumns.find((c) => c.id === destColumnId);
      if (!sourceCol || !destCol) return;

      const movedBetweenColumns = sourceColumnId !== destColumnId;

      let newColumns: BoardColumnWithTasks[];

      if (!movedBetweenColumns) {
        // Same-column reorder
        const reorderedTasks = arrayMove(sourceCol.tasks, source.index, destination.index);
        newColumns = currentColumns.map((c) =>
          c.id === sourceColumnId ? { ...c, tasks: reorderedTasks } : c
        );
      } else {
        // Cross-column move
        const task = sourceCol.tasks[source.index];
        if (!task) return;

        const movedTask = { ...task, column_id: destColumnId };

        const newSourceTasks = sourceCol.tasks.filter((_, i) => i !== source.index);
        const newDestTasks = [...destCol.tasks];
        newDestTasks.splice(destination.index, 0, movedTask);

        newColumns = currentColumns.map((c) => {
          if (c.id === sourceColumnId) return { ...c, tasks: newSourceTasks };
          if (c.id === destColumnId) return { ...c, tasks: newDestTasks };
          return c;
        });
      }

      columnsRef.current = newColumns;
      setColumns(newColumns);

      // Calculate position for persistence based on final task position in destination column
      const finalDestCol = newColumns.find((c) => c.id === destColumnId);
      if (!finalDestCol) return;

      const reorderedTasks = finalDestCol.tasks;
      const taskIndex = destination.index;
      let newPosition: number;

      if (reorderedTasks.length <= 1) {
        newPosition = 0;
      } else if (taskIndex === 0) {
        newPosition = reorderedTasks[1].position - POSITION_GAP;
      } else if (taskIndex === reorderedTasks.length - 1) {
        newPosition = reorderedTasks[taskIndex - 1].position + POSITION_GAP;
      } else {
        newPosition = Math.round(
          (reorderedTasks[taskIndex - 1].position + reorderedTasks[taskIndex + 1].position) / 2
        );
      }

      if (!isTestMode) {
        setPendingOps((n) => n + 1);
        try {
          await moveBoardTask(result.draggableId, ideaId, destColumnId, newPosition);
        } catch {
          toast.error("Failed to move task");
          setLastServerKey(""); // force re-sync when pendingOps reaches 0
        } finally {
          setPendingOps((n) => n - 1);
          lastMoveTimeRef.current = Date.now();
        }
      }
    },
    [ideaId, isTestMode, detectColumnUnderPointer]
  );

  // Detect when the target task exists but is filtered out
  useEffect(() => {
    if (!autoOpenTaskId) return;
    const existsInFull = columns.some((col) =>
      col.tasks.some((t) => t.id === autoOpenTaskId)
    );
    if (!existsInFull) return; // Task doesn't exist on this board at all
    const visibleInFiltered = filteredColumns.some((col) =>
      col.tasks.some((t) => t.id === autoOpenTaskId)
    );
    if (!visibleInFiltered) {
      toast.info("The linked task is hidden by current filters", {
        action: {
          label: "Clear filters",
          onClick: () => {
            setSearchQuery("");
            setAssigneeFilter("all");
            setLabelFilter([]);
            setDueDateFilter("all");
            setShowArchived(true);
          },
        },
      });
    }
  }, [autoOpenTaskId, columns, filteredColumns]);

  return (
    <BoardOpsContext.Provider value={boardOps}>
    <TaskAutoOpenContext.Provider value={autoOpenCtx}>
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
        columns={columns}
        ideaId={ideaId}
        ideaDescription={ideaDescription}
        currentUserId={currentUserId}
        hasApiKey={hasApiKey}
        botProfiles={botProfiles}
        isReadOnly={isReadOnly}
      />
      {isMounted ? (
        <DragDropContext
          onDragStart={isReadOnly ? undefined : handleDragStart}
          onDragEnd={isReadOnly ? (_result: DropResult) => {} : handleDragEnd}
        >
          {/* Scroll container is a PARENT of the Droppable — this lets the library's
              built-in auto-scroll detect it and scroll it during drags, which keeps
              internal drop-target tracking in sync (unlike programmatic scrolling). */}
          <div className="relative min-h-0 flex-1">
            <div
              ref={scrollContainerRef}
              onScroll={handleScrollCheck}
              className={`h-full overflow-x-auto ${
                isDragging ? "!snap-none" : "snap-x snap-mandatory sm:snap-none"
              }`}
            >
              <Droppable droppableId="board" direction="horizontal" type="COLUMN">
                {(boardProvided) => (
                  <div
                    ref={boardProvided.innerRef}
                    {...boardProvided.droppableProps}
                    className="flex h-full items-start gap-4 pb-4"
                    style={{ width: "max-content" }}
                  >
                    {filteredColumns.map((filteredCol, index) => {
                      const fullCol = columns.find((c) => c.id === filteredCol.id)!;
                      return (
                        <BoardColumn
                          key={filteredCol.id}
                          column={filteredCol}
                          index={index}
                          totalTaskCount={fullCol.tasks.filter((t) => !t.archived).length}
                          ideaId={ideaId}
                          teamMembers={teamMembers}
                          boardLabels={boardLabels}
                          checklistItemsByTaskId={checklistItemsByTaskId}
                          highlightQuery={searchQuery}
                          currentUserId={currentUserId}
                          initialTaskId={autoOpenTaskId}
                          userBots={userBots}
                          coverImageUrls={coverImageUrls}
                          hasApiKey={hasApiKey}
                          ideaDescription={ideaDescription}
                          isReadOnly={isReadOnly}
                          isDragTarget={dragOverColumnId === filteredCol.id}
                        />
                      );
                    })}
                    {!isReadOnly && <AddColumnButton ideaId={ideaId} />}
                    {boardProvided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
            {/* Right-edge fade gradient — visible on mobile when more columns exist off-screen */}
            {canScrollRight && (
              <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent sm:hidden" />
            )}
          </div>
        </DragDropContext>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading board...</p>
        </div>
      )}
    </div>
    </TaskAutoOpenContext.Provider>
    </BoardOpsContext.Provider>
  );
}
