"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { logTaskActivity } from "@/lib/activity";
import {
  createChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from "@/actions/board";
import type { BoardChecklistItem } from "@/types";

interface ChecklistSectionProps {
  items: BoardChecklistItem[];
  taskId: string;
  ideaId: string;
  currentUserId?: string;
  isReadOnly?: boolean;
}

export function ChecklistSection({
  items,
  taskId,
  ideaId,
  currentUserId,
  isReadOnly = false,
}: ChecklistSectionProps) {
  const [localItems, setLocalItems] = useState<BoardChecklistItem[]>(items);
  const [newTitle, setNewTitle] = useState("");
  const pendingOps = useRef(0);

  // Sync from server props when no pending operations
  useEffect(() => {
    if (pendingOps.current === 0) {
      setLocalItems(items);
    }
  }, [items]);

  const total = localItems.length;
  const done = localItems.filter((i) => i.completed).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    // Optimistic: add item immediately
    const tempId = `temp-${Date.now()}`;
    const maxPos = localItems.reduce((max, i) => Math.max(max, i.position), 0);
    const optimisticItem: BoardChecklistItem = {
      id: tempId,
      task_id: taskId,
      idea_id: ideaId,
      title,
      completed: false,
      position: maxPos + 1,
      created_at: new Date().toISOString(),
    };
    setLocalItems((prev) => [...prev, optimisticItem]);
    setNewTitle("");

    pendingOps.current++;
    try {
      await createChecklistItem(taskId, ideaId, title);
      if (currentUserId) {
        logTaskActivity(taskId, ideaId, currentUserId, "checklist_item_added", {
          title,
        });
      }
    } catch {
      // Rollback
      setLocalItems((prev) => prev.filter((i) => i.id !== tempId));
      toast.error("Failed to add checklist item");
    } finally {
      pendingOps.current--;
    }
  }

  async function handleToggle(itemId: string) {
    const item = localItems.find((i) => i.id === itemId);
    if (!item) return;

    // Optimistic: toggle immediately
    const newCompleted = !item.completed;
    setLocalItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, completed: newCompleted } : i))
    );

    pendingOps.current++;
    try {
      await toggleChecklistItem(itemId, ideaId);
      if (currentUserId && newCompleted) {
        logTaskActivity(taskId, ideaId, currentUserId, "checklist_item_completed", {
          title: item.title,
        });
      }
    } catch {
      // Rollback
      setLocalItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, completed: !newCompleted } : i
        )
      );
      toast.error("Failed to update checklist item");
    } finally {
      pendingOps.current--;
    }
  }

  async function handleDelete(itemId: string) {
    // Optimistic: remove immediately
    const removed = localItems.find((i) => i.id === itemId);
    setLocalItems((prev) => prev.filter((i) => i.id !== itemId));

    pendingOps.current++;
    try {
      await deleteChecklistItem(itemId, ideaId);
    } catch {
      // Rollback
      if (removed) {
        setLocalItems((prev) => [...prev, removed]);
      }
      toast.error("Failed to delete checklist item");
    } finally {
      pendingOps.current--;
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Checklist</span>
        {total > 0 && (
          <span className="text-xs text-muted-foreground">
            {done}/{total}
          </span>
        )}
      </div>

      {total > 0 && <Progress value={progress} className="h-1.5" />}

      <div className="space-y-1">
        {localItems
          .sort((a, b) => a.position - b.position)
          .map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50"
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={isReadOnly ? undefined : () => handleToggle(item.id)}
                disabled={isReadOnly}
              />
              <span
                className={`flex-1 text-sm ${
                  item.completed
                    ? "text-muted-foreground line-through"
                    : ""
                }`}
              >
                {item.title}
              </span>
              {!isReadOnly && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete item</TooltipContent>
                </Tooltip>
              )}
            </div>
          ))}
      </div>

      {!isReadOnly && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add an item..."
            className="h-8 text-sm"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="sm"
                variant="outline"
                className="h-8"
                disabled={!newTitle.trim()}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add item</TooltipContent>
          </Tooltip>
        </form>
      )}
    </div>
  );
}
