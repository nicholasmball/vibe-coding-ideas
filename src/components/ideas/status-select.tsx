"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_CONFIG } from "@/lib/constants";
import { updateIdeaStatus } from "@/actions/ideas";
import type { IdeaStatus } from "@/types";

interface StatusSelectProps {
  ideaId: string;
  currentStatus: IdeaStatus;
}

export function StatusSelect({ ideaId, currentStatus }: StatusSelectProps) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string) => {
    startTransition(async () => {
      await updateIdeaStatus(ideaId, value as IdeaStatus);
    });
  };

  return (
    <Select value={currentStatus} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-[160px]">
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
