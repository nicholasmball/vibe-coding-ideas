"use client";

import { useOptimistic, useTransition } from "react";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleVote } from "@/actions/votes";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  ideaId: string;
  upvotes: number;
  hasVoted: boolean;
}

export function VoteButton({ ideaId, upvotes, hasVoted }: VoteButtonProps) {
  const [isPending, startTransition] = useTransition();
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
      await toggleVote(ideaId);
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleVote}
      disabled={isPending}
      className={cn(
        "flex flex-col items-center gap-0 px-3 py-2 h-auto",
        optimisticState.hasVoted &&
          "border-primary bg-primary/10 text-primary hover:bg-primary/20"
      )}
    >
      <ChevronUp className="h-4 w-4" />
      <span className="text-xs font-semibold">{optimisticState.upvotes}</span>
    </Button>
  );
}
