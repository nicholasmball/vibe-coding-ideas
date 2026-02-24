"use client";

import { useTransition } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestCollaboration } from "@/actions/collaborators";

interface RequestAccessButtonProps {
  ideaId: string;
}

export function RequestAccessButton({ ideaId }: RequestAccessButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="default"
      className="gap-1.5 text-xs"
      onClick={() => {
        startTransition(async () => {
          try {
            await requestCollaboration(ideaId);
            toast.success("Collaboration request sent");
          } catch {
            toast.error("Failed to send request");
          }
        });
      }}
      disabled={isPending}
    >
      <UserPlus className="h-3.5 w-3.5" />
      Request Access
    </Button>
  );
}
