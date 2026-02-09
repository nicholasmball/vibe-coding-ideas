"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { LABEL_COLORS } from "@/lib/constants";
import { getLabelColorConfig } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { BoardLabel } from "@/types";

interface LabelPickerProps {
  boardLabels: BoardLabel[];
  taskLabels: BoardLabel[];
  taskId: string;
  ideaId: string;
  children: React.ReactNode;
}

export function LabelPicker({
  boardLabels,
  taskLabels,
  taskId,
  ideaId,
  children,
}: LabelPickerProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("blue");
  const [saving, setSaving] = useState(false);

  // Optimistic local state for assigned label IDs
  const [localLabelIds, setLocalLabelIds] = useState<Set<string>>(
    () => new Set(taskLabels.map((l) => l.id))
  );

  // Sync with props when they change (after Realtime refresh)
  const [lastTaskLabelsKey, setLastTaskLabelsKey] = useState(
    () => taskLabels.map((l) => l.id).sort().join(",")
  );
  const currentKey = taskLabels.map((l) => l.id).sort().join(",");
  if (currentKey !== lastTaskLabelsKey) {
    setLocalLabelIds(new Set(taskLabels.map((l) => l.id)));
    setLastTaskLabelsKey(currentKey);
  }

  async function handleToggleLabel(labelId: string) {
    const isCurrentlyAssigned = localLabelIds.has(labelId);

    // Optimistic update
    setLocalLabelIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyAssigned) {
        next.delete(labelId);
      } else {
        next.add(labelId);
      }
      return next;
    });

    const supabase = createClient();
    let error;

    if (isCurrentlyAssigned) {
      ({ error } = await supabase
        .from("board_task_labels")
        .delete()
        .eq("task_id", taskId)
        .eq("label_id", labelId));
    } else {
      ({ error } = await supabase
        .from("board_task_labels")
        .insert({ task_id: taskId, label_id: labelId }));
    }

    if (error) {
      // Revert on error
      setLocalLabelIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyAssigned) {
          next.add(labelId);
        } else {
          next.delete(labelId);
        }
        return next;
      });
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("board_labels")
      .insert({ idea_id: ideaId, name: newName.trim(), color: newColor });

    if (!error) {
      setNewName("");
      setNewColor("blue");
      setCreating(false);
    }
    setSaving(false);
  }

  async function handleUpdate(labelId: string) {
    if (!newName.trim()) return;

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("board_labels")
      .update({ name: newName.trim(), color: newColor })
      .eq("id", labelId);

    if (!error) {
      setEditingId(null);
      setNewName("");
      setNewColor("blue");
    }
    setSaving(false);
  }

  async function handleDelete(labelId: string) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("board_labels")
      .delete()
      .eq("id", labelId);

    if (!error) {
      setEditingId(null);
    }
    setSaving(false);
  }

  function startEdit(label: BoardLabel) {
    setEditingId(label.id);
    setNewName(label.name);
    setNewColor(label.color);
    setCreating(false);
  }

  function startCreate() {
    setCreating(true);
    setEditingId(null);
    setNewName("");
    setNewColor("blue");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Labels
        </p>

        {/* Existing labels */}
        <div className="space-y-1">
          {boardLabels.map((label) => {
            if (editingId === label.id) {
              return (
                <div key={label.id} className="space-y-2 rounded-md border p-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-7 text-xs"
                    placeholder="Label name"
                  />
                  <div className="flex flex-wrap gap-1">
                    {LABEL_COLORS.map((c) => (
                      <button
                        key={c.value}
                        className={`h-5 w-5 rounded-sm ${c.swatchColor} ${
                          newColor === c.value
                            ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                            : ""
                        }`}
                        onClick={() => setNewColor(c.value)}
                        type="button"
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="h-6 flex-1 text-xs"
                      onClick={() => handleUpdate(label.id)}
                      disabled={saving || !newName.trim()}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 text-xs"
                      onClick={() => handleDelete(label.id)}
                      disabled={saving}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              );
            }

            const config = getLabelColorConfig(label.color);
            return (
              <div
                key={label.id}
                className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50"
              >
                <Checkbox
                  checked={localLabelIds.has(label.id)}
                  onCheckedChange={() => handleToggleLabel(label.id)}
                />
                <span className={`h-3 w-3 shrink-0 rounded-sm ${config.swatchColor}`} />
                <span className="flex-1 text-xs font-medium">
                  {label.name}
                </span>
                <button
                  className="text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
                  onClick={() => startEdit(label)}
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Create new label */}
        {creating ? (
          <form onSubmit={handleCreate} className="mt-2 space-y-2 rounded-md border p-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-7 text-xs"
              placeholder="Label name"
              autoFocus
            />
            <div className="flex flex-wrap gap-1">
              {LABEL_COLORS.map((c) => (
                <button
                  key={c.value}
                  className={`h-5 w-5 rounded-sm ${c.swatchColor} ${
                    newColor === c.value
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                      : ""
                  }`}
                  onClick={() => setNewColor(c.value)}
                  type="button"
                />
              ))}
            </div>
            <div className="flex gap-1">
              <Button
                type="submit"
                size="sm"
                className="h-6 flex-1 text-xs"
                disabled={saving || !newName.trim()}
              >
                <Check className="mr-1 h-3 w-3" />
                Create
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => setCreating(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-start gap-1.5 text-xs text-muted-foreground"
            onClick={startCreate}
          >
            <Plus className="h-3 w-3" />
            Create a label
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
