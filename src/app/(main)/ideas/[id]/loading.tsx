import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function IdeaDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-12 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      {/* Status and Actions */}
      <div className="mt-6 flex gap-3">
        <Skeleton className="h-10 w-[160px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>

      {/* Tags */}
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>

      {/* Description */}
      <div className="mt-6 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      <Separator className="my-6" />

      {/* Comments */}
      <Skeleton className="h-6 w-32" />
      <div className="mt-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
