"use client";

import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiscussionEmptyProps {
  ideaId: string;
  canCreate: boolean;
}

export function DiscussionEmpty({ ideaId, canCreate }: DiscussionEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
      <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
      <h3 className="mt-4 text-sm font-semibold">No discussions yet</h3>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        Start a discussion to plan features, debate approaches,
        <br />
        or share research with your team.
      </p>
      {canCreate && (
        <Link href={`/ideas/${ideaId}/discussions/new`} className="mt-4">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Start a Discussion
          </Button>
        </Link>
      )}
    </div>
  );
}
