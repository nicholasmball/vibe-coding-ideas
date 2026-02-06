"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function FeedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
      <h2 className="mt-4 text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-muted-foreground">
        {error.message || "Failed to load the idea feed."}
      </p>
      <Button onClick={reset} className="mt-6">
        Try Again
      </Button>
    </div>
  );
}
