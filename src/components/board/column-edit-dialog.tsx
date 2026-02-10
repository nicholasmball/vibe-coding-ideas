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
import { updateBoardColumn } from "@/actions/board";

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
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await updateBoardColumn(columnId, ideaId, title.trim(), isDoneColumn);
      onOpenChange(false);
    } catch {
      // RLS will block unauthorized access
    } finally {
      setLoading(false);
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
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
