"use client";

import { useOptimistic, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_CONFIG } from "@/lib/constants";
import { updateIdeaStatus } from "@/actions/ideas";
import { toast } from "sonner";
import type { IdeaStatus } from "@/types";

interface StatusSelectProps {
  ideaId: string;
  currentStatus: IdeaStatus;
}

export function StatusSelect({ ideaId, currentStatus }: StatusSelectProps) {
  const [, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(
    currentStatus,
    (_: IdeaStatus, next: IdeaStatus) => next
  );

  const handleChange = (value: string) => {
    const newStatus = value as IdeaStatus;
    startTransition(async () => {
      setOptimisticStatus(newStatus);
      try {
        await updateIdeaStatus(ideaId, newStatus);
      } catch {
        toast.error("Failed to update status");
      }
    });
  };

  return (
    <Select value={optimisticStatus} onValueChange={handleChange}>
      <SelectTrigger className="w-[160px]" data-testid="status-select">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(STATUS_CONFIG) as [IdeaStatus, typeof STATUS_CONFIG[IdeaStatus]][]).map(
          ([value, config]) => (
            <SelectItem key={value} value={value}>
              <span className={config.color}>{config.label}</span>
            </SelectItem>
          )
        )}
      </SelectContent>
    </Select>
  );
}
