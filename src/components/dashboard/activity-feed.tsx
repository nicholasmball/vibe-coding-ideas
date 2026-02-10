"use client";

import Link from "next/link";
import { Bell, MessageSquare, ChevronUp, Users, Trash2, ArrowRightLeft, AtSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import type { NotificationWithDetails } from "@/types";

const iconMap = {
  comment: MessageSquare,
  vote: ChevronUp,
  collaborator: Users,
  user_deleted: Trash2,
  status_change: ArrowRightLeft,
  task_mention: AtSign,
};

const messageMap = {
  comment: "commented on",
  vote: "voted on",
  collaborator: "wants to build",
  user_deleted: "removed an idea you were collaborating on",
  status_change: "updated the status of",
  task_mention: "mentioned you in a task on",
};

interface ActivityFeedProps {
  notifications: NotificationWithDetails[];
}

export function ActivityFeed({ notifications }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No recent activity.
          </p>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => {
              const Icon = iconMap[notification.type];
              const content = (
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">
                        {notification.actor.full_name ?? "Someone"}
                      </span>{" "}
                      {messageMap[notification.type]}
                      {notification.idea && (
                        <>
                          {" "}
                          <span className="font-medium">
                            {notification.idea.title}
                          </span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              );

              const className = `rounded-md px-3 py-2.5 transition-colors hover:bg-muted ${
                !notification.read ? "bg-primary/5" : ""
              }`;

              if (notification.idea_id) {
                const href =
                  notification.type === "task_mention"
                    ? `/ideas/${notification.idea_id}/board`
                    : `/ideas/${notification.idea_id}`;
                return (
                  <Link
                    key={notification.id}
                    href={href}
                    className={`block ${className}`}
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
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
