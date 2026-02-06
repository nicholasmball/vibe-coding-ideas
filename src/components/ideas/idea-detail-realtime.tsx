"use client";

import { useRealtimeSubscription } from "@/hooks/use-realtime";

export function IdeaDetailRealtime({ ideaId }: { ideaId: string }) {
  useRealtimeSubscription("comments", { column: "idea_id", value: ideaId });
  useRealtimeSubscription("votes", { column: "idea_id", value: ideaId });
  useRealtimeSubscription("collaborators", {
    column: "idea_id",
    value: ideaId,
  });

  return null;
}
