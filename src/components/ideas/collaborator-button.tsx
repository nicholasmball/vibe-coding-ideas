"use client";

import { useTransition } from "react";
import { Users, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleCollaborator } from "@/actions/collaborators";

interface CollaboratorButtonProps {
  ideaId: string;
  isCollaborator: boolean;
  isAuthor: boolean;
}

export function CollaboratorButton({
  ideaId,
  isCollaborator,
  isAuthor,
}: CollaboratorButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (isAuthor) return null;

  const handleToggle = () => {
    startTransition(async () => {
      await toggleCollaborator(ideaId);
    });
  };

  return (
    <Button
      variant={isCollaborator ? "outline" : "default"}
      onClick={handleToggle}
      disabled={isPending}
      className="gap-2"
    >
      {isCollaborator ? (
        <>
          <UserMinus className="h-4 w-4" />
          Leave Project
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          I want to build this
        </>
      )}
    </Button>
  );
}
