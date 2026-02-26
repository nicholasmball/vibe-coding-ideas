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
        <Button
          variant="outline"
          size="sm"
          onClick={handleVote}
          className={cn(
            "flex flex-col items-center gap-0 px-2.5 py-1.5 h-auto",
            optimisticState.hasVoted &&
              "border-primary bg-primary/10 text-primary hover:bg-primary/20"
          )}
        >
          <ChevronUp className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold">{optimisticState.upvotes}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {optimisticState.hasVoted ? "Remove upvote" : "Upvote this discussion"}
      </TooltipContent>
    </Tooltip>
  );
}
