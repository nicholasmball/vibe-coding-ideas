"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { BotProfile } from "@/types";

const EnhanceIdeaDialog = dynamic(() => import("./enhance-idea-dialog").then((m) => m.EnhanceIdeaDialog), { ssr: false });

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

  if (variant === "dropdown") {
    return (
      <>
        <button
          className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent ${disabled ? "opacity-50" : ""}`}
          onClick={() => !disabled && setOpen(true)}
        >
          <Sparkles className="h-4 w-4" />
          Enhance with AI
        </button>
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

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={disabled ? 0 : undefined}>
              <Button
                variant="outline"
                size="sm"
                className={`gap-2 ${disabled ? "pointer-events-none opacity-50" : ""}`}
                onClick={() => !disabled && setOpen(true)}
              >
                <Sparkles className="h-4 w-4" />
                Enhance with AI
              </Button>
            </span>
          </TooltipTrigger>
          {disabled && (
            <TooltipContent side="bottom">
              Add your API key in profile settings to enable AI
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
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
