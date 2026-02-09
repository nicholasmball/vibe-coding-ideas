import Link from "next/link";
import { MessageSquare, Users, LayoutDashboard, Github } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { IdeaStatusBadge } from "./idea-status-badge";
import { VoteButton } from "./vote-button";
import { formatRelativeTime, stripMarkdown } from "@/lib/utils";
import type { IdeaWithAuthor } from "@/types";

interface IdeaCardProps {
  idea: IdeaWithAuthor;
  hasVoted: boolean;
  taskCount?: number;
}

export function IdeaCard({ idea, hasVoted, taskCount }: IdeaCardProps) {
  const initials =
    idea.author.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "?";

  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <VoteButton
            ideaId={idea.id}
            upvotes={idea.upvotes}
            hasVoted={hasVoted}
          />
          <div className="flex-1 min-w-0">
            <Link
              href={`/ideas/${idea.id}`}
              className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1"
            >
              {idea.title}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {stripMarkdown(idea.description)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <IdeaStatusBadge status={idea.status} />
          {idea.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {idea.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{idea.tags.length - 3}
            </Badge>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
                <AvatarImage src={idea.author.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
              </Avatar>
              <span>{idea.author.full_name ?? "Anonymous"}</span>
            </div>
            <span>{formatRelativeTime(idea.created_at)}</span>
          </div>
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {idea.comment_count}
                </span>
              </TooltipTrigger>
              <TooltipContent>Comments</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {idea.collaborator_count}
                </span>
              </TooltipTrigger>
              <TooltipContent>Collaborators</TooltipContent>
            </Tooltip>
            {taskCount != null && taskCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    {taskCount}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Board tasks</TooltipContent>
              </Tooltip>
            )}
            {idea.github_url && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1">
                    <Github className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>GitHub repository</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
