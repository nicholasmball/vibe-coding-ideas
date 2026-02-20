"use client";

import { createContext, useContext } from "react";
import type { BoardColumnWithTasks, BoardTaskWithAssignee, BoardColumn } from "@/types";

export interface BoardOptimisticOps {
  /** Insert a temp task into a column. Returns rollback function. */
  createTask: (columnId: string, tempTask: BoardTaskWithAssignee) => () => void;
  /** Remove a task from a column. Returns rollback function. */
  deleteTask: (taskId: string, columnId: string) => () => void;
  /** Append a temp column. Returns rollback function. */
  createColumn: (tempColumn: BoardColumnWithTasks) => () => void;
  /** Remove a column. Returns rollback function. */
  deleteColumn: (columnId: string) => () => void;
  /** Update column fields. Returns rollback function. */
  updateColumn: (columnId: string, updates: Partial<BoardColumn>) => () => void;
  /** Mark all non-archived tasks in a column as archived. Returns rollback function. */
  archiveColumnTasks: (columnId: string) => () => void;
  /** Increment pending ops counter (prevents Realtime from overwriting state). */
  incrementPendingOps: () => void;
  /** Decrement pending ops counter and mark last op time. */
  decrementPendingOps: () => void;
}

export const BoardOpsContext = createContext<BoardOptimisticOps | null>(null);

export function useBoardOps(): BoardOptimisticOps {
  const ctx = useContext(BoardOpsContext);
  if (!ctx) {
    throw new Error("useBoardOps must be used within a BoardOpsContext.Provider");
  }
  return ctx;
}
