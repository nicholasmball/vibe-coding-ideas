"use client";

import { useRealtimeSubscription } from "@/hooks/use-realtime";

export function BoardRealtime({ ideaId }: { ideaId: string }) {
  useRealtimeSubscription("board_columns", {
    column: "idea_id",
    value: ideaId,
  });
  useRealtimeSubscription("board_tasks", {
    column: "idea_id",
    value: ideaId,
  });
  return null;
}
