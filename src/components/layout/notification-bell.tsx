"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  MessageSquare,
  ChevronUp,
  Users,
  Check,
  Trash2,
  ArrowRightLeft,
  AtSign,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { markAllNotificationsRead, markNotificationsRead } from "@/actions/notifications";
import { RequestActionButtons } from "@/components/layout/request-action-buttons";
import { formatRelativeTime } from "@/lib/utils";
import type { NotificationWithDetails } from "@/types";

const iconMap = {
  comment: MessageSquare,
  vote: ChevronUp,
  collaborator: Users,
  user_deleted: Trash2,
  status_change: ArrowRightLeft,
  task_mention: AtSign,
  collaboration_request: UserPlus,
  collaboration_response: UserCheck,
};

const messageMap = {
  comment: "commented on",
  vote: "voted on",
  collaborator: "joined as collaborator on",
  user_deleted: "removed an idea you were collaborating on",
  status_change: "updated the status of",
  task_mention: "mentioned you in a task on",
  collaboration_request: "requested to collaborate on",
  collaboration_response: "responded to your collaboration request on",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fetchNotifications = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select(
        "*, actor:users!notifications_actor_id_fkey(id, full_name, avatar_url, email, bio, github_username, created_at, updated_at), idea:ideas!notifications_idea_id_fkey(id, title)"
      )
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data as unknown as NotificationWithDetails[]);
      setUnreadCount(data.filter((n) => !n.read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const supabase = createClient();
    const channel = supabase
      .channel("notifications-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => fetchNotifications())
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    });
  };

  const handleRequestHandled = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    markNotificationsRead([notificationId]);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button data-testid="notification-bell" variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 max-w-80">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              <Check className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet</div>
          ) : (
            notifications.map((notification) => {
              const Icon = iconMap[notification.type as keyof typeof iconMap] ?? Bell;
              const content = (
                <>
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{notification.actor.full_name ?? "Someone"}</span>{" "}
                      {messageMap[notification.type as keyof typeof messageMap] ?? "interacted with"}
                      {notification.idea && (
                        <>
                          {" "}
                          <span className="font-medium truncate">{notification.idea.title}</span>
                        </>
                      )}
                    </p>
                    {notification.type === "collaboration_request" &&
                      notification.collaboration_request_id &&
                      notification.idea_id &&
                      !notification.read && (
                        <RequestActionButtons
                          notificationId={notification.id}
                          requestId={notification.collaboration_request_id}
                          ideaId={notification.idea_id}
                          onHandled={handleRequestHandled}
                        />
                      )}
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(notification.created_at)}</p>
                  </div>
                  {!notification.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </>
              );

              const className = `flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-muted ${
                !notification.read ? "bg-primary/5" : ""
              }`;

              if (notification.idea_id) {
                const href = notification.task_id
                  ? `/ideas/${notification.idea_id}/board?taskId=${notification.task_id}`
                  : `/ideas/${notification.idea_id}`;
                return (
                  <Link
                    key={notification.id}
                    href={href}
                    onClick={() => {
                      setOpen(false);
                      if (!notification.read) {
                        setNotifications((prev) =>
                          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
                        );
                        setUnreadCount((prev) => Math.max(0, prev - 1));
                        markNotificationsRead([notification.id]);
                      }
                    }}
                    className={className}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div key={notification.id} className={className}>
                  {content}
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
