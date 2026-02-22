"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { removeCollaborator } from "@/actions/collaborators";
import { undoableAction } from "@/lib/undo-toast";

interface RemoveCollaboratorButtonProps {
  ideaId: string;
  userId: string;
  userName?: string;
}

export function RemoveCollaboratorButton({
  ideaId,
  userId,
  userName,
}: RemoveCollaboratorButtonProps) {
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRemoved(true);
    undoableAction({
      message: `Removed ${userName ?? "collaborator"}`,
      execute: () => removeCollaborator(ideaId, userId),
      undo: () => setRemoved(false),
      errorMessage: "Failed to remove collaborator",
    });
  };

  return (
    <button
      onClick={handleRemove}
      className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
      aria-label="Remove collaborator"
    >
      <X className="h-3 w-3" />
    </button>
  );
}
