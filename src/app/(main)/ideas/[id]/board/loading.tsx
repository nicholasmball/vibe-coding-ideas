import { Skeleton } from "@/components/ui/skeleton";

export default function BoardLoading() {
  return (
    <div className="px-4 py-6">
      {/* Board toolbar */}
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 3 }).map((_, col) => (
          <div
            key={col}
            className="w-72 shrink-0 rounded-xl border border-border bg-muted/30 p-3"
          >
            {/* Column header */}
            <div className="mb-3 flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>

            {/* Task cards */}
            <div className="space-y-2">
              {Array.from({ length: col === 0 ? 4 : col === 1 ? 2 : 1 }).map(
                (_, task) => (
                  <div
                    key={task}
                    className="rounded-lg border border-border bg-background p-3"
                  >
                    <Skeleton className="mb-2 h-4 w-full" />
                    <Skeleton className="mb-3 h-3 w-2/3" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-12 rounded-full" />
                      <Skeleton className="h-5 w-5 rounded-full" />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
