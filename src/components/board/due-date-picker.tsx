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
import { formatDueDate, getDueDateStatus } from "@/lib/utils";
import { logTaskActivity } from "@/lib/activity";
import { updateBoardTask } from "@/actions/board";

interface DueDatePickerProps {
  taskId: string;
  ideaId: string;
  dueDate: string | null;
  currentUserId?: string;
}

export function DueDatePicker({ taskId, ideaId, dueDate, currentUserId }: DueDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [optimisticDate, setOptimisticDate] = useState<string | null | undefined>(undefined);

  // Reset optimistic state when the prop changes externally (e.g. via Realtime/MCP)
  const [lastPropDate, setLastPropDate] = useState(dueDate);
  if (dueDate !== lastPropDate) {
    setLastPropDate(dueDate);
    setOptimisticDate(undefined);
  }

  const displayDate = optimisticDate !== undefined ? optimisticDate : dueDate;
  const selected = displayDate ? new Date(displayDate) : undefined;
  const status = displayDate ? getDueDateStatus(displayDate) : null;

  const statusStyles = {
    overdue: "text-red-400",
    due_soon: "text-amber-400",
    on_track: "text-muted-foreground",
  };

  async function handleSelect(date: Date | undefined) {
    const isoDate = date ? date.toISOString() : null;
    setOptimisticDate(isoDate);
    setOpen(false);

    try {
      await updateBoardTask(taskId, ideaId, { due_date: isoDate });
      if (currentUserId) {
        logTaskActivity(
          taskId,
          ideaId,
          currentUserId,
          isoDate ? "due_date_set" : "due_date_removed"
        );
      }
    } catch {
      setOptimisticDate(undefined);
    }
  }

  function handleClear() {
    handleSelect(undefined);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 gap-1.5 text-xs ${status ? statusStyles[status] : ""}`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {displayDate ? formatDueDate(displayDate) : "Set due date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          initialFocus
        />
        {displayDate && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1.5 text-xs text-muted-foreground"
              onClick={handleClear}
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
