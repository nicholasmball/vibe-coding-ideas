"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  ArrowRight,
  UserPlus,
  UserMinus,
  CalendarDays,
  CalendarX,
  Tag,
  Archive,
  ArchiveRestore,
  Pencil,
  FileText,
  ListPlus,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Trash2,
  Activity,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/utils";
import { ACTIVITY_ACTIONS } from "@/lib/constants";
import type { DashboardBot } from "@/types";

const ICON_MAP: Record<string, React.ElementType> = {
  Plus,
  ArrowRight,
  UserPlus,
  UserMinus,
  CalendarDays,
  CalendarX,
  Tag,
  TagX: Tag,
  Archive,
  ArchiveRestore,
  Pencil,
  FileText,
  ListPlus,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Trash2,
};

type BotActivityEntry = {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
  task: { id: string; title: string } | null;
  idea: { id: string; title: string } | null;
};

type BotAssignedTask = {
  id: string;
  title: string;
  column: { title: string; is_done_column: boolean };
  idea: { id: string; title: string };
};

const PAGE_SIZE = 30;

interface BotActivityDialogProps {
  bot: DashboardBot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BotActivityDialog({
  bot,
  open,
  onOpenChange,
}: BotActivityDialogProps) {
  const [activities, setActivities] = useState<BotActivityEntry[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<BotAssignedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const fetchData = useCallback(
    async (offset = 0) => {
      if (!bot) return;
      const supabase = createClient();

      if (offset === 0) {
        // Fetch both activity and assigned tasks on initial load
        const [activityResult, tasksResult] = await Promise.all([
          supabase
            .from("board_task_activity")
            .select(
              "id, action, details, created_at, task:board_tasks!board_task_activity_task_id_fkey(id, title), idea:ideas!board_task_activity_idea_id_fkey(id, title)"
            )
            .eq("actor_id", bot.id)
            .order("created_at", { ascending: false })
            .range(0, PAGE_SIZE - 1),
          supabase
            .from("board_tasks")
            .select(
              "id, title, column:board_columns!board_tasks_column_id_fkey(title, is_done_column), idea:ideas!board_tasks_idea_id_fkey(id, title)"
            )
            .eq("assignee_id", bot.id)
            .eq("archived", false)
            .order("updated_at", { ascending: false }),
        ]);

        const actItems = (activityResult.data ??
          []) as unknown as BotActivityEntry[];
        setActivities(actItems);
        setHasMore(actItems.length === PAGE_SIZE);

        const taskItems = (
          (tasksResult.data ?? []) as unknown as BotAssignedTask[]
        ).filter((t) => !t.column.is_done_column);
        setAssignedTasks(taskItems);
      } else {
        // Paginate activity only
        const { data } = await supabase
          .from("board_task_activity")
          .select(
            "id, action, details, created_at, task:board_tasks!board_task_activity_task_id_fkey(id, title), idea:ideas!board_task_activity_idea_id_fkey(id, title)"
          )
          .eq("actor_id", bot.id)
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        const items = (data ?? []) as unknown as BotActivityEntry[];
        setActivities((prev) => [...prev, ...items]);
        setHasMore(items.length === PAGE_SIZE);
      }

      setLoading(false);
    },
    [bot]
  );

  useEffect(() => {
    if (open && bot) {
      setLoading(true);
      setActivities([]);
      setAssignedTasks([]);
      fetchData();
    }
  }, [open, bot, fetchData]);

  if (!bot) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              {bot.avatar_url && (
                <AvatarImage src={bot.avatar_url} alt={bot.name} />
              )}
              <AvatarFallback className="text-xs">
                {bot.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="truncate">{bot.name}</span>
                {bot.role && (
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {bot.role}
                  </Badge>
                )}
                {bot.isActiveMcpBot && (
                  <Badge className="bg-emerald-500/90 text-white text-[10px] font-normal">
                    MCP Active
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assigned Tasks Section */}
          <section>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4" />
              Assigned Tasks
              {assignedTasks.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-normal"
                >
                  {assignedTasks.length}
                </Badge>
              )}
            </h3>
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading...</p>
            ) : assignedTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No tasks currently assigned
              </p>
            ) : (
              <div className="space-y-1.5">
                {assignedTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={`/ideas/${task.idea.id}/board?taskId=${task.id}`}
                    className="flex items-center gap-2 rounded-md border border-border p-2 text-xs hover:bg-muted/50 transition-colors group"
                    onClick={() => onOpenChange(false)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {task.idea.title}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] shrink-0"
                    >
                      {task.column.title}
                    </Badge>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Activity Feed Section */}
          <section>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              Activity
              {activities.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] font-normal"
                >
                  {activities.length}
                  {hasMore ? "+" : ""}
                </Badge>
              )}
            </h3>
            {loading ? (
              <p className="text-xs text-muted-foreground">Loading...</p>
            ) : activities.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No activity recorded yet
              </p>
            ) : (
              <>
                <ScrollArea className="max-h-72">
                  <div className="space-y-2.5 pr-4">
                    {activities.map((entry) => {
                      const config = ACTIVITY_ACTIONS[entry.action];
                      const IconComponent = config
                        ? (ICON_MAP[config.icon] ?? Activity)
                        : Activity;
                      const label = config?.label ?? entry.action;

                      return (
                        <div key={entry.id} className="flex items-start gap-2">
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted">
                            <IconComponent className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs">
                              <span className="font-medium">{label}</span>
                              {entry.task && (
                                <>
                                  {" "}
                                  <Link
                                    href={`/ideas/${entry.idea?.id}/board?taskId=${entry.task.id}`}
                                    className="text-primary hover:underline"
                                    onClick={() => onOpenChange(false)}
                                  >
                                    {entry.task.title}
                                  </Link>
                                </>
                              )}
                            </p>
                            {entry.idea && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {entry.idea.title}
                              </p>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                              {formatRelativeTime(entry.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                {hasMore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground mt-2"
                    onClick={() => fetchData(activities.length)}
                  >
                    Load more
                  </Button>
                )}
              </>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
