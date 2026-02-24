"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, ChevronUp, Users, Trash2, ArrowRightLeft, AtSign } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import type { NotificationWithDetails } from "@/types";

const INITIAL_LIMIT = 5;

function getIcon(type: string): LucideIcon {
  switch (type) {
    case "comment":
      return MessageSquare;
    case "vote":
      return ChevronUp;
    case "collaborator":
    case "collaboration_request":
    case "collaboration_response":
      return Users;
    case "user_deleted":
      return Trash2;
    case "status_change":
      return ArrowRightLeft;
    case "task_mention":
      return AtSign;
    default:
      return MessageSquare;
  }
}

function getMessage(type: string): string {
  switch (type) {
    case "comment":
      return "commented on";
    case "vote":
      return "voted on";
    case "collaborator":
      return "joined as collaborator on";
    case "user_deleted":
      return "removed an idea you were collaborating on";
    case "status_change":
      return "updated the status of";
    case "task_mention":
      return "mentioned you in a task on";
    case "collaboration_request":
      return "requested to collaborate on";
    case "collaboration_response":
      return "responded to your collaboration request on";
    default:
      return "interacted with";
  }
}

interface ActivityFeedProps {
  notifications: NotificationWithDetails[];
}

export function ActivityFeed({ notifications }: ActivityFeedProps) {
  const [showAll, setShowAll] = useState(false);

  if (notifications.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-muted-foreground">
          No recent activity.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Activity shows up when others vote, comment, or collaborate on your ideas.
        </p>
      </div>
    );
  }

  const visibleNotifications =
    showAll || notifications.length <= INITIAL_LIMIT ? notifications : notifications.slice(0, INITIAL_LIMIT);

  return (
    <div className="space-y-1">
      {visibleNotifications.map((notification) => {
        const Icon = getIcon(notification.type);
        const content = (
          <div className="flex items-start gap-3">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{notification.actor.full_name ?? "Someone"}</span>{" "}
                {getMessage(notification.type)}
                {notification.idea && (
                  <>
                    {" "}
                    <span className="font-medium">{notification.idea.title}</span>
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground">{formatRelativeTime(notification.created_at)}</p>
            </div>
            {!notification.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
          </div>
        );

        const className = `rounded-md px-3 py-2.5 transition-colors hover:bg-muted ${
          !notification.read ? "bg-primary/5" : ""
        }`;

        if (notification.idea_id) {
          const href =
            notification.type === "task_mention"
              ? `/ideas/${notification.idea_id}/board${notification.task_id ? `?taskId=${notification.task_id}` : ""}`
              : `/ideas/${notification.idea_id}`;
          return (
            <Link key={notification.id} href={href} className={`block ${className}`}>
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
      {!showAll && notifications.length > INITIAL_LIMIT && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground"
          onClick={() => setShowAll(true)}
        >
          Show all ({notifications.length})
        </Button>
      )}
    </div>
  );
}
