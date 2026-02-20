"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createBoardColumn } from "@/actions/board";
import { useBoardOps } from "./board-context";
import type { BoardColumnWithTasks } from "@/types";

interface AddColumnButtonProps {
  ideaId: string;
}

export function AddColumnButton({ ideaId }: AddColumnButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const ops = useBoardOps();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const trimmedTitle = title.trim();

    // Build optimistic column
    const tempColumn: BoardColumnWithTasks = {
      id: `temp-${crypto.randomUUID()}`,
      idea_id: ideaId,
      title: trimmedTitle,
      position: Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_done_column: false,
      tasks: [],
    };

    // Optimistically insert & reset form
    const rollback = ops.createColumn(tempColumn);
    ops.incrementPendingOps();
    setTitle("");
    setIsAdding(false);

    try {
      await createBoardColumn(ideaId, trimmedTitle);
    } catch {
      rollback();
      toast.error("Failed to create column");
    } finally {
      ops.decrementPendingOps();
    }
  }

  if (!isAdding) {
    return (
      <Button
        variant="outline"
        className="h-auto min-w-[280px] self-start border-dashed py-6"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Column
      </Button>
    );
  }

  return (
    <div className="min-w-[280px] rounded-lg border border-border bg-muted/50 p-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Column name..."
          autoFocus
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={!title.trim()}>
            Add
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAdding(false);
              setTitle("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
