"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeSubscription(
  table: string,
  filter?: { column: string; value: string }
) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channelName = filter
      ? `${table}-${filter.column}-${filter.value}`
      : `${table}-all`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {}),
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [table, filter?.column, filter?.value, router]);
}
