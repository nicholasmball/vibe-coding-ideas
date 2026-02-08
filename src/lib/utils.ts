import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months}mo ago`;
  }
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years}y ago`;
}

export function getDueDateStatus(dueDate: string): "overdue" | "due_soon" | "on_track" {
  const due = new Date(dueDate);
  const now = new Date();
  if (due < now) return "overdue";
  const diffMs = due.getTime() - now.getTime();
  if (diffMs < 24 * 60 * 60 * 1000) return "due_soon";
  return "on_track";
}

export function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

import { LABEL_COLORS } from "./constants";

export function getLabelColorConfig(color: string) {
  return LABEL_COLORS.find((c) => c.value === color) ?? LABEL_COLORS[6]; // default blue
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, "")          // headings
    .replace(/\*\*\*(.*?)\*\*\*/g, "$1") // bold italic
    .replace(/\*\*(.*?)\*\*/g, "$1")     // bold
    .replace(/\*(.*?)\*/g, "$1")         // italic
    .replace(/~~(.*?)~~/g, "$1")         // strikethrough
    .replace(/`{1,3}[^`]*`{1,3}/g, "")  // inline/block code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/^[-*+]\s+/gm, "")         // unordered list markers
    .replace(/^\d+\.\s+/gm, "")         // ordered list markers
    .replace(/^>\s+/gm, "")             // blockquotes
    .replace(/\n{2,}/g, " ")            // collapse multiple newlines
    .replace(/\n/g, " ")                // remaining newlines
    .trim();
}
