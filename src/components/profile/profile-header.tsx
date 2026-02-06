import { Github, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { User } from "@/types";

interface ProfileHeaderProps {
  user: User;
  ideaCount: number;
  collaborationCount: number;
  commentCount: number;
}

export function ProfileHeader({
  user,
  ideaCount,
  collaborationCount,
  commentCount,
}: ProfileHeaderProps) {
  const initials =
    user.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "?";

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Avatar className="h-20 w-20">
          <AvatarImage src={user.avatar_url ?? undefined} />
          <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold">
            {user.full_name ?? "Anonymous"}
          </h1>
          {user.bio && (
            <p className="mt-1 text-muted-foreground">{user.bio}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            {user.github_username && (
              <a
                href={`https://github.com/${user.github_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <Github className="h-4 w-4" />
                {user.github_username}
              </a>
            )}
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Joined {formatRelativeTime(user.created_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-4">
        <div className="text-center">
          <p className="text-2xl font-bold">{ideaCount}</p>
          <p className="text-sm text-muted-foreground">Ideas</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{collaborationCount}</p>
          <p className="text-sm text-muted-foreground">Collaborating</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{commentCount}</p>
          <p className="text-sm text-muted-foreground">Comments</p>
        </div>
      </div>
    </div>
  );
}
