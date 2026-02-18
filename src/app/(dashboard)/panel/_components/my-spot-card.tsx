/**
 * MySpotCard Component
 *
 * Shows a management user's assigned spot and its current status today.
 * Only rendered for management and admin roles with an assigned spot.
 */

import { Badge } from "@/components/ui/badge";
import type { SpotWithStatus } from "@/types";

interface MySpotCardProps {
  spot: SpotWithStatus;
}

export function MySpotCard({ spot }: MySpotCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold">
          {spot.label}
        </div>
        <div className="space-y-1">
          <p className="text-sm leading-none font-medium">Tu plaza asignada</p>
          <SpotStatusBadge
            status={spot.status}
            reservedBy={spot.reserved_by_name}
          />
        </div>
      </div>
      <SpotStatusDescription
        status={spot.status}
        reservedBy={spot.reserved_by_name}
      />
    </div>
  );
}

function SpotStatusBadge({ status }: { status: string; reservedBy?: string }) {
  switch (status) {
    case "occupied":
      return (
        <Badge variant="secondary" className="text-xs">
          Libre hoy (no cedida)
        </Badge>
      );
    case "ceded":
      return (
        <Badge
          variant="outline"
          className="border-amber-500 text-xs text-amber-600"
        >
          Cedida — sin reservar
        </Badge>
      );
    case "reserved":
      return (
        <Badge
          variant="outline"
          className="border-green-500 text-xs text-green-600"
        >
          Cedida — reservada
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="text-xs">
          {status}
        </Badge>
      );
  }
}

function SpotStatusDescription({
  status,
  reservedBy,
}: {
  status: string;
  reservedBy?: string;
}) {
  switch (status) {
    case "occupied":
      return (
        <p className="text-muted-foreground text-xs">
          Tu plaza está disponible para ti hoy. Puedes cederla desde la página
          de Parking.
        </p>
      );
    case "ceded":
      return (
        <p className="text-muted-foreground text-xs">
          Has cedido tu plaza hoy pero nadie la ha reservado aún.
        </p>
      );
    case "reserved":
      return (
        <p className="text-muted-foreground text-xs">
          {reservedBy
            ? `Reservada por ${reservedBy}`
            : "Alguien ha reservado tu plaza cedida"}
        </p>
      );
    default:
      return null;
  }
}
