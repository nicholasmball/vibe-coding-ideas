"use client";

import { getLabelColorConfig } from "@/lib/utils";
import type { BoardLabel } from "@/types";

interface TaskLabelBadgesProps {
  labels: BoardLabel[];
  maxVisible?: number;
}

export function TaskLabelBadges({ labels, maxVisible = 3 }: TaskLabelBadgesProps) {
  if (labels.length === 0) return null;

  const visible = labels.slice(0, maxVisible);
  const overflow = labels.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((label) => {
        const config = getLabelColorConfig(label.color);
        return (
          <span
            key={label.id}
            className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${config.badgeClass}`}
          >
            {label.name}
          </span>
        );
      })}
      {overflow > 0 && (
        <span className="inline-flex items-center rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          +{overflow}
        </span>
      )}
    </div>
  );
}
