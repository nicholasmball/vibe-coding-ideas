"use client";

import { useState } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { logTaskActivity } from "@/lib/activity";
import type { BoardChecklistItem } from "@/types";

interface ChecklistSectionProps {
  items: BoardChecklistItem[];
  taskId: string;
  ideaId: string;
  currentUserId?: string;
}

export function ChecklistSection({
  items,
  taskId,
  ideaId,
  currentUserId,
}: ChecklistSectionProps) {
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const total = items.length;
  const done = items.filter((i) => i.completed).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setLoading(true);
    const supabase = createClient();
    const maxPos = items.length > 0
      ? Math.max(...items.map((i) => i.position))
      : -1;

    const { error } = await supabase.from("board_checklist_items").insert({
      task_id: taskId,
      idea_id: ideaId,
      title: newTitle.trim(),
      position: maxPos + 1,
    });

    if (!error) {
      if (currentUserId) {
        logTaskActivity(taskId, ideaId, currentUserId, "checklist_item_added", {
          title: newTitle.trim(),
        });
      }
      setNewTitle("");
    }
    setLoading(false);
  }

  async function handleToggle(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("board_checklist_items")
      .update({ completed: !item.completed })
      .eq("id", itemId);

    if (!error && currentUserId && !item.completed) {
      logTaskActivity(taskId, ideaId, currentUserId, "checklist_item_completed", {
        title: item.title,
      });
    }
  }

  async function handleDelete(itemId: string) {
    const supabase = createClient();
    await supabase
      .from("board_checklist_items")
      .delete()
      .eq("id", itemId);
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="h-8"
              disabled={loading || !newTitle.trim()}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add item</TooltipContent>
        </Tooltip>
      </form>
    </div>
  );
}
