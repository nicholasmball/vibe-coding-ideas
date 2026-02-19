"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { EnhanceIdeaDialog } from "./enhance-idea-dialog";
import type { BotProfile, AiCredits } from "@/types";

interface EnhanceIdeaButtonProps {
  ideaId: string;
  ideaTitle: string;
  currentDescription: string;
  bots: BotProfile[];
  aiCredits?: AiCredits | null;
}

export function EnhanceIdeaButton({
  ideaId,
  ideaTitle,
  currentDescription,
  bots,
  aiCredits,
}: EnhanceIdeaButtonProps) {
  const [open, setOpen] = useState(false);

  const exhausted = !aiCredits?.isByok && aiCredits?.remaining === 0;

  const button = (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => setOpen(true)}
      disabled={exhausted}
    >
      <Sparkles className="h-4 w-4" />
      Enhance with AI
      {aiCredits && !aiCredits.isByok && aiCredits.remaining !== null && (
        <span className="text-[10px] text-muted-foreground">
          {aiCredits.remaining}/{aiCredits.limit}
        </span>
      )}
    </Button>
  );

  return (
    <>
      {exhausted ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>{button}</span>
          </TooltipTrigger>
          <TooltipContent>Daily limit reached</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
      <EnhanceIdeaDialog
        open={open}
        onOpenChange={setOpen}
        ideaId={ideaId}
        ideaTitle={ideaTitle}
        currentDescription={currentDescription}
        bots={bots}
        aiCredits={aiCredits}
      />
    </>
  );
}
