/**
 * Dashboard Loading State
 *
 * Skeleton shown during navigation within authenticated routes.
 */

import { Main } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <Main>
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="space-y-4">
        {/* Stats Cards Skeleton (4 columns) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>

        {/* Content Row Skeleton (7 columns: 4 main + 3 side) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
          {/* Main Content (Recent Reservations) */}
          <Skeleton className="col-span-1 h-[400px] rounded-xl lg:col-span-4" />

          {/* Right Panel (My Spot / Admin) */}
          <Skeleton className="col-span-1 h-[400px] rounded-xl lg:col-span-3" />
        </div>
      </div>
    </Main>
  );
}
