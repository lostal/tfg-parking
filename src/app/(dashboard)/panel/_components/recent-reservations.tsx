/**
 * RecentReservations Component
 *
 * Displays the user's upcoming reservations in a list format.
 * Based on shadcn-admin's "Recent Sales" pattern.
 */

import { ParkingCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ReservationWithDetails } from "@/lib/queries/reservations";

interface RecentReservationsProps {
  reservations: ReservationWithDetails[];
}

export function RecentReservations({ reservations }: RecentReservationsProps) {
  if (reservations.length === 0) {
    return (
      <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
        No tienes reservas próximas
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reservations.slice(0, 5).map((reservation) => (
        <div key={reservation.id} className="flex items-center">
          <div className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
            <ParkingCircle className="size-5" />
          </div>
          <div className="ml-4 space-y-1">
            <p className="text-sm leading-none font-medium">
              Plaza {reservation.spot_label}
            </p>
            <p className="text-muted-foreground text-xs">
              {formatDate(reservation.date)}
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant="secondary" className="text-xs">
              Confirmada
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
