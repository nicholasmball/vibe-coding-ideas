"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

  const handleClick = () => {
    if (disabled) {
      toast.info("Add your API key in profile settings to enable AI");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      {variant === "dropdown" ? (
        <button
          className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent ${disabled ? "opacity-50" : ""}`}
          onClick={handleClick}
        >
          <Sparkles className="h-4 w-4" />
          Enhance with AI
        </button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${disabled ? "opacity-50" : ""}`}
          onClick={handleClick}
        >
          <Sparkles className="h-4 w-4" />
          Enhance with AI
        </Button>
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
