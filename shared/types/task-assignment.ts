import type { TaskAssignmentStatus } from "./worker";

// Log entry for streaming
export interface LogEntry {
  timestamp: string;
  stream: "stdout" | "stderr";
  message: string;
}

// Container metrics
export interface ContainerMetrics {
  cpu_percent: number;
  memory_mb: number;
  memory_limit_mb: number;
}

// SSE event types
export type LogStreamEvent =
  | { type: "log"; data: LogEntry }
  | { type: "status"; data: { status: TaskAssignmentStatus } }
  | { type: "metrics"; data: ContainerMetrics }
  | { type: "error"; data: { message: string } }
  | { type: "complete"; data: { exit_code: number } };
