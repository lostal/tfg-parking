/**
 * Dashboard Loading State
 *
 * Skeleton shown during navigation within authenticated routes.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Title skeleton */}
      <div className="bg-muted h-8 w-48 animate-pulse rounded-md" />
      {/* Subtitle skeleton */}
      <div className="bg-muted h-4 w-72 animate-pulse rounded-md" />
      {/* Content skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-muted h-32 animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}
