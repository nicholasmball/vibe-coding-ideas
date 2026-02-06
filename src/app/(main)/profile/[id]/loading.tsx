import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Profile Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="mx-auto h-8 w-12" />
              <Skeleton className="mx-auto h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="mt-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-6">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="mt-2 h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
