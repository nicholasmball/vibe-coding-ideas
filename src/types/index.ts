import type { Database } from "./database";

// Base row types
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Idea = Database["public"]["Tables"]["ideas"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Collaborator = Database["public"]["Tables"]["collaborators"]["Row"];
export type Vote = Database["public"]["Tables"]["votes"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

// Enums
export type IdeaStatus = Database["public"]["Enums"]["idea_status"];
export type IdeaVisibility = Database["public"]["Enums"]["idea_visibility"];
export type CommentType = Database["public"]["Enums"]["comment_type"];
export type VoteType = Database["public"]["Enums"]["vote_type"];
export type NotificationType = Database["public"]["Enums"]["notification_type"];

// Derived types
export type IdeaWithAuthor = Idea & {
  author: User;
};

export type CommentWithAuthor = Comment & {
  author: User;
  replies?: CommentWithAuthor[];
};

export type IdeaDetail = Idea & {
  author: User;
  comments: CommentWithAuthor[];
  collaborators: CollaboratorWithUser[];
  user_vote?: Vote | null;
  is_collaborator?: boolean;
};

export type CollaboratorWithUser = Collaborator & {
  user: User;
};

export type NotificationWithDetails = Notification & {
  actor: User;
  idea: { id: string; title: string } | null;
};

// Notification preferences
export type NotificationPreferences = User["notification_preferences"];

// Board types
export type BoardColumn = Database["public"]["Tables"]["board_columns"]["Row"];
export type BoardTask = Database["public"]["Tables"]["board_tasks"]["Row"];
export type BoardLabel = Database["public"]["Tables"]["board_labels"]["Row"];
export type BoardTaskLabel = Database["public"]["Tables"]["board_task_labels"]["Row"];
export type BoardChecklistItem = Database["public"]["Tables"]["board_checklist_items"]["Row"];
export type BoardTaskActivity = Database["public"]["Tables"]["board_task_activity"]["Row"];
export type BoardTaskComment = Database["public"]["Tables"]["board_task_comments"]["Row"];
export type BoardTaskAttachment = Database["public"]["Tables"]["board_task_attachments"]["Row"];
export type BotProfile = Database["public"]["Tables"]["bot_profiles"]["Row"];
export type BoardTaskWithAssignee = BoardTask & {
  assignee: User | null;
  labels: BoardLabel[];
};
export type BoardColumnWithTasks = BoardColumn & { tasks: BoardTaskWithAssignee[] };
export type BoardTaskActivityWithActor = BoardTaskActivity & { actor: User };
export type BoardTaskCommentWithAuthor = BoardTaskComment & { author: User };

// Dashboard types
export type DashboardTask = BoardTask & {
  assignee: User | null;
  labels: BoardLabel[];
  column: { id: string; title: string; is_done_column: boolean };
  idea: { id: string; title: string };
};

// Sort options
export type SortOption = "newest" | "popular" | "discussed";
