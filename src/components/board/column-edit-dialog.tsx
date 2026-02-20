"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { updateBoardColumn } from "@/actions/board";
import { useBoardOps } from "./board-context";

interface ColumnEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
  ideaId: string;
  currentTitle: string;
  currentIsDoneColumn: boolean;
}

export function ColumnEditDialog({
  open,
  onOpenChange,
  columnId,
  ideaId,
  currentTitle,
  currentIsDoneColumn,
}: ColumnEditDialogProps) {
  const [title, setTitle] = useState(currentTitle);
  const [isDoneColumn, setIsDoneColumn] = useState(currentIsDoneColumn);
  const ops = useBoardOps();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const trimmedTitle = title.trim();
    const updates: { title: string; is_done_column: boolean } = {
      title: trimmedTitle,
      is_done_column: isDoneColumn,
    };

    // Optimistic update & close immediately
    const rollback = ops.updateColumn(columnId, updates);
    ops.incrementPendingOps();
    onOpenChange(false);

    try {
      await updateBoardColumn(columnId, ideaId, trimmedTitle, isDoneColumn);
    } catch {
      rollback();
      toast.error("Failed to update column");
    } finally {
      ops.decrementPendingOps();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Column</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="column-title">Column Name</Label>
            <Input
              id="column-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Column name"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="done-column">Done column</Label>
              <p className="text-xs text-muted-foreground">
                Tasks here won&apos;t appear on dashboards
              </p>
            </div>
            <Switch
              id="done-column"
              checked={isDoneColumn}
              onCheckedChange={setIsDoneColumn}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
