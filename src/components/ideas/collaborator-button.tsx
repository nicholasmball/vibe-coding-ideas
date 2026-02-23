"use client";

import { useOptimistic, useTransition } from "react";
import { UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleCollaborator } from "@/actions/collaborators";
import { toast } from "sonner";

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
  const [, startTransition] = useTransition();
  const [optimisticIsCollaborator, setOptimisticIsCollaborator] = useOptimistic(
    isCollaborator,
    (_: boolean, next: boolean) => next
  );

  if (isAuthor) return null;

  const handleToggle = () => {
    startTransition(async () => {
      setOptimisticIsCollaborator(!optimisticIsCollaborator);
      try {
        await toggleCollaborator(ideaId);
      } catch {
        toast.error("Failed to update collaboration");
      }
    });
  };

  return (
    <Button
      variant={optimisticIsCollaborator ? "outline" : "default"}
      onClick={handleToggle}
      className="gap-2"
    >
      {optimisticIsCollaborator ? (
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
