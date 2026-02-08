"use client";

import { CalendarDays } from "lucide-react";
import { getDueDateStatus, formatDueDate } from "@/lib/utils";

interface DueDateBadgeProps {
  dueDate: string;
}

export function DueDateBadge({ dueDate }: DueDateBadgeProps) {
  const status = getDueDateStatus(dueDate);

  const statusStyles = {
    overdue: "bg-red-400/20 border-red-400/30 text-red-400",
    due_soon: "bg-amber-400/20 border-amber-400/30 text-amber-400",
    on_track: "bg-muted border-border text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium ${statusStyles[status]}`}
    >
      <CalendarDays className="h-3 w-3" />
      {formatDueDate(dueDate)}
    </span>
  );
}
