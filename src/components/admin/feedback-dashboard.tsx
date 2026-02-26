"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bug,
  Lightbulb,
  HelpCircle,
  MoreHorizontal,
  MessageSquare,
  Trash2,
  ExternalLink,
  Check,
  Archive,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import { deleteFeedback, updateFeedbackStatus } from "@/actions/feedback";
import type { FeedbackWithUser } from "@/app/(main)/admin/page";

type FeedbackCategory = "bug" | "suggestion" | "question" | "other";
type FeedbackStatus = "new" | "reviewed" | "archived";

const CATEGORY_CONFIG: Record<FeedbackCategory, { label: string; icon: React.ReactNode; color: string }> = {
  bug: { label: "Bug", icon: <Bug className="h-3.5 w-3.5" />, color: "text-red-400" },
  suggestion: { label: "Suggestion", icon: <Lightbulb className="h-3.5 w-3.5" />, color: "text-amber-400" },
  question: { label: "Question", icon: <HelpCircle className="h-3.5 w-3.5" />, color: "text-blue-400" },
  other: { label: "Other", icon: <MessageSquare className="h-3.5 w-3.5" />, color: "text-muted-foreground" },
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  new: { label: "New", variant: "default" },
  reviewed: { label: "Reviewed", variant: "secondary" },
  archived: { label: "Archived", variant: "outline" },
};

interface FeedbackDashboardProps {
  feedback: FeedbackWithUser[];
  filters: { category: string; status: string };
}

export function FeedbackDashboard({ feedback, filters }: FeedbackDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Preserve the tab
    params.set("tab", "feedback");
    router.push(`/admin?${params.toString()}`);
  }

  const stats = useMemo(() => {
    const byCategory: Record<string, number> = {};
    let newCount = 0;
    for (const f of feedback) {
      byCategory[f.category] = (byCategory[f.category] ?? 0) + 1;
      if (f.status === "new") newCount++;
    }
    return { total: feedback.length, newCount, byCategory };
  }, [feedback]);

  async function handleStatusChange(id: string, status: FeedbackStatus) {
    try {
      await updateFeedbackStatus(id, status);
      router.refresh();
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteFeedback(deleteTarget);
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Failed to delete feedback");
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border p-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select value={filters.category} onValueChange={(v) => updateFilter("category", v)}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.entries(CATEGORY_CONFIG).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                <SelectItem key={value} value={value}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<MessageSquare className="h-4 w-4" />}
          label="Total Feedback"
          value={stats.total.toString()}
          detail={`${stats.newCount} unreviewed`}
        />
        {(["bug", "suggestion", "question"] as const).map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          return (
            <StatCard
              key={cat}
              icon={<span className={config.color}>{config.icon}</span>}
              label={`${config.label}s`}
              value={(stats.byCategory[cat] ?? 0).toString()}
              detail=""
            />
          );
        })}
      </div>

      {/* Feedback Table */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Feedback</h2>
        <div className="max-h-[500px] overflow-y-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">User</TableHead>
                <TableHead className="w-[100px]">Category</TableHead>
                <TableHead>Content</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[100px]">Time</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.map((item) => {
                const catConfig = CATEGORY_CONFIG[item.category as FeedbackCategory] ?? CATEGORY_CONFIG.other;
                const statusConfig = STATUS_CONFIG[(item.status as FeedbackStatus) ?? "new"] ?? STATUS_CONFIG.new;
                const isExpanded = expandedId === item.id;

                return (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <TableCell className="p-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={item.user?.avatar_url ?? undefined} />
                          <AvatarFallback className="text-[9px]">
                            {item.user?.full_name?.[0]?.toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs truncate max-w-[100px]">
                          {item.user?.full_name ?? item.user?.email ?? "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-2">
                      <span className={`inline-flex items-center gap-1 text-xs ${catConfig.color}`}>
                        {catConfig.icon}
                        {catConfig.label}
                      </span>
                    </TableCell>
                    <TableCell className="p-2">
                      <p className={`text-xs ${isExpanded ? "whitespace-pre-wrap" : "line-clamp-2"}`}>
                        {item.content}
                      </p>
                      {item.page_url && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={item.page_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-2.5 w-2.5" />
                              Page context
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>{item.page_url}</TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell className="p-2">
                      <Badge variant={statusConfig.variant} className="text-[10px]">
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-2">
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="p-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {item.status !== "reviewed" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(item.id, "reviewed")}>
                              <Check className="mr-2 h-4 w-4" />
                              Mark reviewed
                            </DropdownMenuItem>
                          )}
                          {item.status !== "archived" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(item.id, "archived")}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          {item.status !== "new" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(item.id, "new")}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Mark as new
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(item.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {feedback.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                    No feedback yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this feedback entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}
