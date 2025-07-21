import { Skeleton } from "@/components/ui/skeleton";

export function MainSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Code viewer skeleton */}
      <div className="flex border rounded-md bg-background p-4 mb-2">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-1/2 mb-2" />
      </div>
      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-48" />
        ))}
      </div>
      {/* Score and history skeleton */}
      <div className="flex items-center gap-4 mb-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
      </div>
      {/* Feedback block skeleton */}
      <div className="bg-muted rounded-lg p-4 space-y-4">
        <Skeleton className="h-5 w-64 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <div className="flex gap-2 mb-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-1/4" />
          ))}
        </div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-8 w-24 mb-2" />
      </div>
    </div>
  );
}

export function ScoreSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-48" />
        ))}
      </div>
      {/* Score and custom score skeleton */}
      <div className="flex items-center gap-4 mb-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      {/* Feedback block skeleton */}
      <div className="bg-muted rounded-lg p-4 space-y-4">
        <Skeleton className="h-5 w-64 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <div className="flex gap-2 mb-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-1/4" />
          ))}
        </div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-8 w-24 mb-2" />
      </div>
    </div>
  );
}
