"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { respondToRequest } from "@/actions/collaborators";

interface RequestActionButtonsProps {
  notificationId: string;
  requestId: string;
  ideaId: string;
  onHandled: (notificationId: string) => void;
}

export function RequestActionButtons({ notificationId, requestId, ideaId, onHandled }: RequestActionButtonsProps) {
  const [isPending, startTransition] = useTransition();

  const handleRespond = (accept: boolean) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      try {
        await respondToRequest(requestId, ideaId, accept);
        onHandled(notificationId);
      } catch {
        toast.error("Failed to respond to request");
      }
    });
  };

  return (
    <div className="mt-1 flex items-center gap-1">
      <Button
        size="sm"
        variant="outline"
        className="h-6 gap-1 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
        onClick={handleRespond(true)}
        disabled={isPending}
      >
        <Check className="h-3 w-3" />
        Accept
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-6 gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        onClick={handleRespond(false)}
        disabled={isPending}
      >
        <Ban className="h-3 w-3" />
        Decline
      </Button>
    </div>
  );
}
