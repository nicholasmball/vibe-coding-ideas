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
import type { BotProfile } from "@/types";

interface EnhanceIdeaButtonProps {
  ideaId: string;
  ideaTitle: string;
  currentDescription: string;
  bots: BotProfile[];
  variant?: "button" | "dropdown";
  disabled?: boolean;
}

export function EnhanceIdeaButton({
  ideaId,
  ideaTitle,
  currentDescription,
  bots,
  variant = "button",
  disabled = false,
}: EnhanceIdeaButtonProps) {
  const [open, setOpen] = useState(false);

  const button = variant === "dropdown" ? (
    <button
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
      onClick={() => setOpen(true)}
      disabled={disabled}
    >
      <Sparkles className="h-4 w-4" />
      Enhance with AI
    </button>
  ) : (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => setOpen(true)}
      disabled={disabled}
    >
      <Sparkles className="h-4 w-4" />
      Enhance with AI
    </Button>
  );

  return (
    <>
      {disabled ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>{button}</span>
          </TooltipTrigger>
          <TooltipContent>Add your API key in profile settings to enable AI</TooltipContent>
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
      />
    </>
  );
}
