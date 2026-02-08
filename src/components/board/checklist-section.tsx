"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
}

export function ChecklistSection({
  items,
  taskId,
  ideaId,
}: ChecklistSectionProps) {
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const total = items.length;
  const done = items.filter((i) => i.completed).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setLoading(true);
    try {
      await createChecklistItem(taskId, ideaId, newTitle.trim());
      setNewTitle("");
    } catch {
      // RLS will block unauthorized
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(itemId: string) {
    setTogglingIds((prev) => new Set(prev).add(itemId));
    try {
      await toggleChecklistItem(itemId, ideaId);
    } catch {
      // RLS will block unauthorized
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }

  async function handleDelete(itemId: string) {
    setDeletingIds((prev) => new Set(prev).add(itemId));
    try {
      await deleteChecklistItem(itemId, ideaId);
    } catch {
      // RLS will block unauthorized
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
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
        {items
          .sort((a, b) => a.position - b.position)
          .map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50"
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={() => handleToggle(item.id)}
                disabled={togglingIds.has(item.id)}
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
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={() => handleDelete(item.id)}
                disabled={deletingIds.has(item.id)}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          ))}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add an item..."
          className="h-8 text-sm"
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          className="h-8"
          disabled={loading || !newTitle.trim()}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </form>
    </div>
  );
}
