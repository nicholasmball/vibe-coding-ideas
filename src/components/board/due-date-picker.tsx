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
import { createClient } from "@/lib/supabase/client";
import { formatDueDate, getDueDateStatus } from "@/lib/utils";

interface DueDatePickerProps {
  taskId: string;
  ideaId: string;
  dueDate: string | null;
}

export function DueDatePicker({ taskId, ideaId, dueDate }: DueDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [optimisticDate, setOptimisticDate] = useState<string | null | undefined>(undefined);

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

    const supabase = createClient();
    const { error } = await supabase
      .from("board_tasks")
      .update({ due_date: isoDate })
      .eq("id", taskId);

    if (error) {
      // Revert on failure
      setOptimisticDate(undefined);
    }
    // Realtime will pick up the change and refresh the page,
    // at which point the server prop will be correct.
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
