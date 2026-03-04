"use client";

import { useOptimistic, useTransition } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { toggleDiscussionVote } from "@/actions/discussions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DiscussionVoteButtonProps {
  discussionId: string;
  ideaId: string;
  upvotes: number;
  hasVoted: boolean;
}

export function DiscussionVoteButton({
  discussionId,
  ideaId,
  upvotes,
  hasVoted,
}: DiscussionVoteButtonProps) {
  const [, startTransition] = useTransition();
  const [optimisticState, setOptimisticState] = useOptimistic(
    { upvotes, hasVoted },
    (state) => ({
      upvotes: state.hasVoted ? state.upvotes - 1 : state.upvotes + 1,
      hasVoted: !state.hasVoted,
    })
  );

  const handleVote = () => {
    startTransition(async () => {
      setOptimisticState(optimisticState);
      try {
        await toggleDiscussionVote(discussionId, ideaId);
      } catch {
        toast.error("Failed to vote");
      }
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleVote}
          className={cn(
            "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors",
            optimisticState.hasVoted && "text-primary hover:text-primary/80"
          )}
        >
          <ChevronUp className="h-4 w-4" />
          <span className="font-medium">{optimisticState.upvotes}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {optimisticState.hasVoted ? "Remove upvote" : "Upvote this discussion"}
      </TooltipContent>
    </Tooltip>
  );
}
