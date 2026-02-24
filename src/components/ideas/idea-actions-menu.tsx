"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EnhanceIdeaButton } from "@/components/ideas/enhance-idea-button";
import { DeleteIdeaButton } from "@/components/ideas/delete-idea-button";
import type { BotProfile, AiCredits } from "@/types";

interface IdeaActionsMenuProps {
  ideaId: string;
  ideaTitle: string;
  currentDescription: string;
  isAuthor: boolean;
  canDelete: boolean;
  aiEnabled: boolean;
  bots: BotProfile[];
  aiCredits: AiCredits | null;
}

export function IdeaActionsMenu({
  ideaId,
  ideaTitle,
  currentDescription,
  isAuthor,
  canDelete,
  aiEnabled,
  bots,
  aiCredits,
}: IdeaActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 sm:hidden">
          <MoreHorizontal className="h-4 w-4" />
          More
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {isAuthor && (
          <DropdownMenuItem asChild>
            <Link href={`/ideas/${ideaId}/edit`} className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
        )}
        {isAuthor && aiEnabled && (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0">
            <EnhanceIdeaButton
              ideaId={ideaId}
              ideaTitle={ideaTitle}
              currentDescription={currentDescription}
              bots={bots}
              aiCredits={aiCredits}
              variant="dropdown"
            />
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0">
            <DeleteIdeaButton ideaId={ideaId} variant="dropdown" />
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
