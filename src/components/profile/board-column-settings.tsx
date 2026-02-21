"use client";

import { useState, useTransition } from "react";
import { Columns3, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateDefaultBoardColumns } from "@/actions/profile";
import { DEFAULT_BOARD_COLUMNS } from "@/lib/constants";

interface ColumnDef {
  title: string;
  is_done_column: boolean;
}

interface BoardColumnSettingsProps {
  columns: ColumnDef[] | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function BoardColumnSettings({ columns, open: controlledOpen, onOpenChange: controlledOnOpenChange }: BoardColumnSettingsProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;
  const [isPending, startTransition] = useTransition();
  const [localColumns, setLocalColumns] = useState<ColumnDef[]>(
    columns ?? DEFAULT_BOARD_COLUMNS.map((c) => ({ title: c.title, is_done_column: c.is_done_column }))
  );

  function handleAdd() {
    if (localColumns.length >= 10) {
      toast.error("Maximum 10 columns allowed");
      return;
    }
    setLocalColumns([...localColumns, { title: "", is_done_column: false }]);
  }

  function handleRemove(index: number) {
    if (localColumns.length <= 1) {
      toast.error("At least one column is required");
      return;
    }
    setLocalColumns(localColumns.filter((_, i) => i !== index));
  }

  function handleTitleChange(index: number, title: string) {
    setLocalColumns(localColumns.map((col, i) => (i === index ? { ...col, title } : col)));
  }

  function handleDoneToggle(index: number) {
    setLocalColumns(
      localColumns.map((col, i) => (i === index ? { ...col, is_done_column: !col.is_done_column } : col))
    );
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const newCols = [...localColumns];
    [newCols[index - 1], newCols[index]] = [newCols[index], newCols[index - 1]];
    setLocalColumns(newCols);
  }

  function handleMoveDown(index: number) {
    if (index === localColumns.length - 1) return;
    const newCols = [...localColumns];
    [newCols[index], newCols[index + 1]] = [newCols[index + 1], newCols[index]];
    setLocalColumns(newCols);
  }

  function handleReset() {
    setLocalColumns(DEFAULT_BOARD_COLUMNS.map((c) => ({ title: c.title, is_done_column: c.is_done_column })));
  }

  function handleSave() {
    // Validate
    const hasDone = localColumns.some((c) => c.is_done_column);
    if (!hasDone) {
      toast.error("At least one column must be marked as done");
      return;
    }
    const hasEmpty = localColumns.some((c) => !c.title.trim());
    if (hasEmpty) {
      toast.error("Column titles cannot be empty");
      return;
    }

    startTransition(async () => {
      try {
        // If it matches defaults exactly, save null (use app defaults)
        const isDefault =
          localColumns.length === DEFAULT_BOARD_COLUMNS.length &&
          localColumns.every(
            (c, i) =>
              c.title === DEFAULT_BOARD_COLUMNS[i].title &&
              c.is_done_column === DEFAULT_BOARD_COLUMNS[i].is_done_column
          );
        await updateDefaultBoardColumns(isDefault ? null : localColumns);
        toast.success("Board column defaults saved");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Columns3 className="h-4 w-4" />
            Board Defaults
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Default Board Columns</DialogTitle>
          <DialogDescription>
            Configure the default columns created when you start a new board.
            Drag to reorder. At least one column must be marked as &quot;Done&quot;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {localColumns.map((col, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  onClick={() => handleMoveUp(i)}
                  disabled={i === 0}
                >
                  <GripVertical className="h-3 w-3 rotate-180" />
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  onClick={() => handleMoveDown(i)}
                  disabled={i === localColumns.length - 1}
                >
                  <GripVertical className="h-3 w-3" />
                </button>
              </div>
              <Input
                value={col.title}
                onChange={(e) => handleTitleChange(i, e.target.value)}
                placeholder="Column name"
                className="h-8 flex-1 text-sm"
                maxLength={100}
              />
              <div className="flex items-center gap-1.5">
                <Switch
                  checked={col.is_done_column}
                  onCheckedChange={() => handleDoneToggle(i)}
                />
                <span className="w-10 text-[10px] text-muted-foreground">
                  {col.is_done_column ? "Done" : "Active"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(i)}
                disabled={localColumns.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-xs"
            onClick={handleAdd}
            disabled={localColumns.length >= 10}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Column
          </Button>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={isPending}>
            Reset to Defaults
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
