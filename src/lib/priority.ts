export const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", color: "text-red-500", dot: "bg-red-500" },
  high: { label: "High", color: "text-orange-500", dot: "bg-orange-500" },
  medium: { label: "Medium", color: "text-yellow-600", dot: "bg-yellow-600/40" },
  low: { label: "Low", color: "text-zinc-500", dot: "bg-zinc-500" },
} as const;

export type TaskPriority = keyof typeof PRIORITY_CONFIG;

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_CONFIG) as [
  TaskPriority,
  (typeof PRIORITY_CONFIG)[TaskPriority],
][];
