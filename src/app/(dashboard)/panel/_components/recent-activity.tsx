/**
 * RecentActivity
 *
 * Displays the latest system-wide reservations and visitor bookings.
 * Follows the shadcn-admin "Recent Sales" pattern with avatar initials.
 * Only rendered for admin role.
 */

import { Badge } from "@/components/ui/badge";
import type { RecentActivity as RecentActivityType } from "@/lib/queries/stats";

interface RecentActivityProps {
  items: RecentActivityType[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function RecentActivity({ items }: RecentActivityProps) {
  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
        Sin actividad reciente
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-4">
          {/* Avatar with initials */}
          <div className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
            {getInitials(item.user_name)}
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-between gap-1">
            <div className="space-y-0.5">
              <p className="text-sm leading-none font-medium">
                {item.user_name}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatDate(item.date)} · Plaza {item.spot_label}
              </p>
            </div>
            <Badge
              variant={item.type === "visitor" ? "outline" : "secondary"}
              className="text-xs"
            >
              {item.type === "visitor" ? "Visitante" : "Reserva"}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
