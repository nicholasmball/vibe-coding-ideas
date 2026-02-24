"use client";

import Link from "next/link";
import { Info, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestAccessButton } from "@/components/board/request-access-button";

interface GuestBoardBannerProps {
  ideaId: string;
  hasRequested: boolean;
}

export function GuestBoardBanner({ ideaId, hasRequested }: GuestBoardBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="h-4 w-4 shrink-0" />
        <span>
          {hasRequested
            ? "Your collaboration request is pending approval"
            : "You are viewing this board in read-only mode"}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!hasRequested && <RequestAccessButton ideaId={ideaId} />}
        {hasRequested && (
          <Button size="sm" variant="outline" className="gap-1.5 text-xs text-muted-foreground" disabled>
            <Clock className="h-3.5 w-3.5" />
            Pending
          </Button>
        )}
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
          <Link href={`/ideas/${ideaId}`}>
            <ExternalLink className="h-3.5 w-3.5" />
            View Idea
          </Link>
        </Button>
      </div>
    </div>
  );
}
