"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function BoardRealtime({ ideaId }: { ideaId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`board-${ideaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "board_columns",
          filter: `idea_id=eq.${ideaId}`,
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "board_tasks",
          filter: `idea_id=eq.${ideaId}`,
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "board_labels",
          filter: `idea_id=eq.${ideaId}`,
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "board_task_labels",
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "board_checklist_items",
          filter: `idea_id=eq.${ideaId}`,
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "board_task_activity",
          filter: `idea_id=eq.${ideaId}`,
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "board_task_comments",
          filter: `idea_id=eq.${ideaId}`,
        },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "board_task_attachments",
          filter: `idea_id=eq.${ideaId}`,
        },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [ideaId, router]);

  return null;
}
