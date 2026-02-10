"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { removeCollaborator } from "@/actions/collaborators";

interface RemoveCollaboratorButtonProps {
  ideaId: string;
  userId: string;
}

export function RemoveCollaboratorButton({
  ideaId,
  userId,
}: RemoveCollaboratorButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();
    startTransition(async () => {
      await removeCollaborator(ideaId, userId);
    });
  };

  return (
    <button
      onClick={handleRemove}
      disabled={isPending}
      className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive disabled:opacity-50"
      aria-label="Remove collaborator"
    >
      <X className="h-3 w-3" />
    </button>
  );
}
