/**
 * AdminAlerts Component
 *
 * Shows pending admin actions and system status.
 * Only rendered for admin role.
 */

import { AlertTriangle, UserPlus } from "lucide-react";
import type { Profile } from "@/lib/supabase/types";

interface AdminAlertsProps {
  /** Management users who don't have a spot assigned yet */
  pendingManagement: Profile[];
  /** Today's occupancy percentage */
  occupancyPercent: number;
}

export function AdminAlerts({
  pendingManagement,
  occupancyPercent,
}: AdminAlertsProps) {
  if (pendingManagement.length === 0) {
    return (
      <div className="space-y-4">
        <OccupancyIndicator percent={occupancyPercent} />
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
          <div className="text-muted-foreground text-sm">
            Sin alertas pendientes
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <OccupancyIndicator percent={occupancyPercent} />
      {pendingManagement.map((user) => (
        <div
          key={user.id}
          className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950"
        >
          <UserPlus className="h-4 w-4 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user.full_name || user.email}
            </p>
            <p className="text-muted-foreground text-xs">
              Dirección sin plaza asignada
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function OccupancyIndicator({ percent }: { percent: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          Ocupación hoy
        </span>
        <span className="font-medium">{percent}%</span>
      </div>
      <div className="bg-secondary h-2 w-full rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
