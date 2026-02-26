"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Pin, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/utils";
import { DiscussionVoteButton } from "./discussion-vote-button";
import type { IdeaDiscussionWithAuthor } from "@/types";

type FilterStatus = "all" | "open" | "resolved";

const STATUS_CONFIG = {
  open: {
    label: "Open",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  resolved: {
    label: "Resolved",
    className: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
  converted: {
    label: "Converted",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
} as const;

interface DiscussionListProps {
  discussions: IdeaDiscussionWithAuthor[];
  ideaId: string;
  votedDiscussionIds?: string[];
}

export function DiscussionList({ discussions, ideaId, votedDiscussionIds = [] }: DiscussionListProps) {
  const votedSet = new Set(votedDiscussionIds);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");

  const filtered = discussions.filter((d) => {
    if (filter !== "all" && d.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.title.toLowerCase().includes(q) || d.body.toLowerCase().includes(q);
    }
    return true;
  });

  // Sort: pinned first, then by last_activity_at
  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime();
  });

  const filterTabs: { value: FilterStatus; label: string; count: number }[] = [
    { value: "all", label: "All", count: discussions.length },
    { value: "open", label: "Open", count: discussions.filter((d) => d.status === "open").length },
    { value: "resolved", label: "Resolved", count: discussions.filter((d) => d.status === "resolved").length },
  ];

  return (
    <div className="space-y-4">
      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search discussions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.value
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 text-[10px] opacity-70">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Discussion items */}
      {sorted.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          {search || filter !== "all"
            ? "No discussions match your filters."
            : null}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((discussion) => {
            const config = STATUS_CONFIG[discussion.status];

            return (
              <div
                key={discussion.id}
                className={`group flex gap-3 rounded-lg border p-4 transition-colors hover:border-foreground/20 hover:bg-accent/30 ${
                  discussion.pinned ? "border-amber-500/30 bg-amber-500/5" : ""
                }`}
              >
                {/* Vote button */}
                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                  <DiscussionVoteButton
                    discussionId={discussion.id}
                    ideaId={ideaId}
                    upvotes={discussion.upvotes}
                    hasVoted={votedSet.has(discussion.id)}
                  />
                </div>

                {/* Content */}
                <Link
                  href={`/ideas/${ideaId}/discussions/${discussion.id}`}
                  className="min-w-0 flex-1"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold group-hover:text-foreground">
                      {discussion.title}
                    </h3>
                    <Badge variant="outline" className={`shrink-0 text-[10px] ${config.className}`}>
                      {config.label}
                    </Badge>
                    {discussion.pinned && (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-400"
                      >
                        <Pin className="mr-1 h-2.5 w-2.5" />
                        Pinned
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {discussion.body}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={discussion.author.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[8px]">
                          {(discussion.author.full_name ?? "?")[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>{discussion.author.full_name ?? "Anonymous"}</span>
                    </div>
                    <span>{formatRelativeTime(discussion.last_activity_at)}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {discussion.reply_count}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
