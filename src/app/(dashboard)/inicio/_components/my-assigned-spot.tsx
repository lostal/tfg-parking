/**
 * MyAssignedSpot
 *
 * Shows the status of the management user's assigned spot.
 * Displays whether it's occupied today, ceded, or available.
 * Used in the /inicio page right panel.
 */

import { ParkingCircle, Repeat, Lock, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SpotWithStatus } from "@/types";

interface MyAssignedSpotProps {
  spot: SpotWithStatus | null;
}

const STATUS_CONFIG = {
  occupied: {
    label: "Ocupada por ti",
    description: "Tu plaza está ocupada hoy",
    icon: Lock,
    iconClass: "text-amber-600",
    bgClass: "bg-amber-50 dark:bg-amber-950",
    borderClass: "border-amber-200 dark:border-amber-900",
    badgeVariant: "outline" as const,
  },
  ceded: {
    label: "Cedida",
    description: "Tu plaza está disponible para reservas",
    icon: Repeat,
    iconClass: "text-blue-600",
    bgClass: "bg-blue-50 dark:bg-blue-950",
    borderClass: "border-blue-200 dark:border-blue-900",
    badgeVariant: "secondary" as const,
  },
  reserved: {
    label: "Reservada por otra persona",
    description: "Alguien ha reservado tu plaza cedida",
    icon: CheckCircle,
    iconClass: "text-green-600",
    bgClass: "bg-green-50 dark:bg-green-950",
    borderClass: "border-green-200 dark:border-green-900",
    badgeVariant: "default" as const,
  },
  free: {
    label: "Libre",
    description: "No tienes reserva hoy, tu plaza está libre",
    icon: ParkingCircle,
    iconClass: "text-muted-foreground",
    bgClass: "bg-muted/50",
    borderClass: "border-border",
    badgeVariant: "outline" as const,
  },
  "visitor-blocked": {
    label: "Bloqueada — visitante",
    description: "Tu plaza está asignada a un visitante",
    icon: Lock,
    iconClass: "text-red-600",
    bgClass: "bg-red-50 dark:bg-red-950",
    borderClass: "border-red-200 dark:border-red-900",
    badgeVariant: "destructive" as const,
  },
};

export function MyAssignedSpot({ spot }: MyAssignedSpotProps) {
  if (!spot) {
    return (
      <div className="flex h-28 flex-col items-center justify-center gap-1 text-center">
        <ParkingCircle className="text-muted-foreground/40 h-8 w-8" />
        <p className="text-sm font-medium">Sin plaza asignada</p>
        <p className="text-muted-foreground text-xs">
          Contacta con el administrador
        </p>
      </div>
    );
  }

  const config =
    STATUS_CONFIG[spot.status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.free;
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-4 rounded-lg border p-4 ${config.bgClass} ${config.borderClass}`}
    >
      <div className="mt-0.5 shrink-0">
        <Icon className={`h-5 w-5 ${config.iconClass}`} />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Plaza {spot.label}</p>
          <Badge variant={config.badgeVariant} className="shrink-0 text-xs">
            {config.label}
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs">{config.description}</p>
        {spot.reserved_by_name && (
          <p className="text-xs font-medium">
            Ocupante:{" "}
            <span className="text-foreground">{spot.reserved_by_name}</span>
          </p>
        )}
      </div>
    </div>
  );
}
