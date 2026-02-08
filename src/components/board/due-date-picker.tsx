"use client";

import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { updateBoardTask } from "@/actions/board";
import { formatDueDate, getDueDateStatus } from "@/lib/utils";

interface DueDatePickerProps {
  taskId: string;
  ideaId: string;
  dueDate: string | null;
}

export function DueDatePicker({ taskId, ideaId, dueDate }: DueDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const selected = dueDate ? new Date(dueDate) : undefined;
  const status = dueDate ? getDueDateStatus(dueDate) : null;

  const statusStyles = {
    overdue: "text-red-400",
    due_soon: "text-amber-400",
    on_track: "text-muted-foreground",
  };

  async function handleSelect(date: Date | undefined) {
    setLoading(true);
    try {
      await updateBoardTask(taskId, ideaId, {
        due_date: date ? date.toISOString() : null,
      });
      if (!date) setOpen(false);
    } catch {
      // RLS will block unauthorized
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    await handleSelect(undefined);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 gap-1.5 text-xs ${status ? statusStyles[status] : ""}`}
          disabled={loading}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {dueDate ? formatDueDate(dueDate) : "Set due date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          initialFocus
        />
        {dueDate && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1.5 text-xs text-muted-foreground"
              onClick={handleClear}
              disabled={loading}
            >
              <X className="h-3 w-3" />
              Remove due date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
