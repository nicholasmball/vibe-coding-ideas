// Worker status enum
export type WorkerStatus = "offline" | "online" | "busy" | "error";

// Task assignment status enum
export type TaskAssignmentStatus =
  | "queued"
  | "assigned"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

// Platform/architecture
export type WorkerPlatform = "darwin" | "linux";
export type WorkerArch = "arm64" | "x64";

// Worker capabilities (sent during registration)
export interface WorkerCapabilities {
  cpu_cores: number;
  memory_gb: number;
  qemu_version: string;
}

// Worker registration payload
export interface WorkerRegistration {
  name: string;
  machine_id: string;
  platform: WorkerPlatform;
  arch: WorkerArch;
  capabilities: WorkerCapabilities;
  max_containers: number;
}

// Worker heartbeat payload
export interface WorkerHeartbeat {
  worker_id: string;
  status: WorkerStatus;
  ngrok_url: string | null;
  running_containers: number;
}

// Task assignment (from backend to worker)
export interface TaskAssignmentPayload {
  assignment_id: string;
  task_id: string;
  idea_id: string;
  task_title: string;
  task_description: string | null;
  git_repo_url: string | null;
  git_main_branch: string;
  git_branch: string;
}

// Task status update (from worker to backend)
export interface TaskStatusUpdate {
  assignment_id: string;
  status: TaskAssignmentStatus;
  container_id?: string;
  error_message?: string;
  exit_code?: number;
}
