import type { IdeaStatus, CommentType, SortOption } from "@/types";

export const STATUS_CONFIG: Record<
  IdeaStatus,
  { label: string; color: string; bgColor: string }
> = {
  open: {
    label: "Open",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10 border-emerald-400/20",
  },
  in_progress: {
    label: "In Progress",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10 border-blue-400/20",
  },
  completed: {
    label: "Completed",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10 border-purple-400/20",
  },
  archived: {
    label: "Archived",
    color: "text-zinc-400",
    bgColor: "bg-zinc-400/10 border-zinc-400/20",
  },
};

export const COMMENT_TYPE_CONFIG: Record<
  CommentType,
  { label: string; color: string; bgColor: string }
> = {
  comment: {
    label: "Comment",
    color: "text-zinc-400",
    bgColor: "bg-zinc-400/10 border-zinc-400/20",
  },
  suggestion: {
    label: "Suggestion",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10 border-amber-400/20",
  },
  question: {
    label: "Question",
    color: "text-sky-400",
    bgColor: "bg-sky-400/10 border-sky-400/20",
  },
};

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Popular" },
  { value: "discussed", label: "Most Discussed" },
];

export const DEFAULT_BOARD_COLUMNS = [
  { title: "To Do", position: 0, is_done_column: false },
  { title: "In Progress", position: 1000, is_done_column: false },
  { title: "Done", position: 2000, is_done_column: true },
];

export const POSITION_GAP = 1000;

export const LABEL_COLORS = [
  { value: "red", label: "Red", badgeClass: "bg-red-500/90 text-white", swatchColor: "bg-red-500" },
  { value: "orange", label: "Orange", badgeClass: "bg-orange-500/90 text-white", swatchColor: "bg-orange-500" },
  { value: "amber", label: "Amber", badgeClass: "bg-amber-500/90 text-white", swatchColor: "bg-amber-500" },
  { value: "lime", label: "Lime", badgeClass: "bg-lime-500/90 text-white", swatchColor: "bg-lime-500" },
  { value: "emerald", label: "Emerald", badgeClass: "bg-emerald-500/90 text-white", swatchColor: "bg-emerald-500" },
  { value: "cyan", label: "Cyan", badgeClass: "bg-cyan-500/90 text-white", swatchColor: "bg-cyan-500" },
  { value: "blue", label: "Blue", badgeClass: "bg-blue-500/90 text-white", swatchColor: "bg-blue-500" },
  { value: "violet", label: "Violet", badgeClass: "bg-violet-500/90 text-white", swatchColor: "bg-violet-500" },
  { value: "pink", label: "Pink", badgeClass: "bg-pink-500/90 text-white", swatchColor: "bg-pink-500" },
  { value: "zinc", label: "Gray", badgeClass: "bg-zinc-500/90 text-white", swatchColor: "bg-zinc-500" },
];

export const ACTIVITY_ACTIONS: Record<string, { label: string; icon: string }> = {
  created: { label: "created this task", icon: "Plus" },
  moved: { label: "moved this task", icon: "ArrowRight" },
  assigned: { label: "assigned", icon: "UserPlus" },
  unassigned: { label: "unassigned", icon: "UserMinus" },
  due_date_set: { label: "set the due date", icon: "CalendarDays" },
  due_date_removed: { label: "removed the due date", icon: "CalendarX" },
  label_added: { label: "added a label", icon: "Tag" },
  label_removed: { label: "removed a label", icon: "TagX" },
  archived: { label: "archived this task", icon: "Archive" },
  unarchived: { label: "unarchived this task", icon: "ArchiveRestore" },
  title_changed: { label: "changed the title", icon: "Pencil" },
  description_changed: { label: "updated the description", icon: "FileText" },
  checklist_item_added: { label: "added a checklist item", icon: "ListPlus" },
  checklist_item_completed: { label: "completed a checklist item", icon: "CheckSquare" },
  comment_added: { label: "added a comment", icon: "MessageSquare" },
  attachment_added: { label: "added an attachment", icon: "Paperclip" },
  attachment_removed: { label: "removed an attachment", icon: "Trash2" },
  bulk_imported: { label: "imported this task", icon: "Upload" },
};

export const BOT_ROLE_TEMPLATES = [
  {
    role: "Developer",
    prompt:
      "You are a senior developer. Focus on clean, tested, and well-documented code. Break tasks into small PRs and follow project conventions.",
  },
  {
    role: "UX Designer",
    prompt:
      "You are a UX designer. Review tasks for usability, accessibility, and visual consistency. Suggest improvements to user flows and interface patterns.",
  },
  {
    role: "Business Analyst",
    prompt:
      "You are a business analyst. Review idea descriptions for clarity, feasibility, and user value. Help refine requirements and acceptance criteria.",
  },
  {
    role: "QA Tester",
    prompt:
      "You are a QA tester. Review completed tasks for edge cases, error handling, and regression risks. Create bug reports for issues found.",
  },
];

export const SUGGESTED_TAGS = [
  "ai",
  "web",
  "mobile",
  "cli",
  "api",
  "game",
  "devtools",
  "saas",
  "open-source",
  "automation",
  "blockchain",
  "data",
  "design",
  "education",
  "social",
];
