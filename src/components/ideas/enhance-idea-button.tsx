"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnhanceIdeaDialog } from "./enhance-idea-dialog";
import type { BotProfile } from "@/types";

interface EnhanceIdeaButtonProps {
  ideaId: string;
  currentDescription: string;
  bots: BotProfile[];
}

export function EnhanceIdeaButton({
  ideaId,
  currentDescription,
  bots,
}: EnhanceIdeaButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
        Enhance with AI
      </Button>
      <EnhanceIdeaDialog
        open={open}
        onOpenChange={setOpen}
        ideaId={ideaId}
        currentDescription={currentDescription}
        bots={bots}
      />
    </>
  );
}
