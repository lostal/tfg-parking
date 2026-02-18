/**
 * UserStatsCards
 *
 * Summary stat cards for the user home page (management & employee).
 * Shows: upcoming reservations, cessions (management), spot today, days this month.
 */

import { CalendarDays, Repeat, ParkingCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserStatsCardsProps {
  upcomingReservations: number;
  upcomingCessions: number | null; // null = employee (no cessions)
  hasSpotToday: boolean;
  spotLabel: string | null;
  reservationsThisMonth: number;
}

export function UserStatsCards({
  upcomingReservations,
  upcomingCessions,
  hasSpotToday,
  spotLabel,
  reservationsThisMonth,
}: UserStatsCardsProps) {
  const cols =
    upcomingCessions !== null
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : "sm:grid-cols-3";

  return (
    <div className={`grid gap-4 ${cols}`}>
      {/* Próximas reservas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Próximas reservas
          </CardTitle>
          <CalendarDays className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingReservations}</div>
          <p className="text-muted-foreground text-xs">próximas confirmadas</p>
        </CardContent>
      </Card>

      {/* Cesiones próximas — solo dirección */}
      {upcomingCessions !== null && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cesiones próximas
            </CardTitle>
            <Repeat className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCessions}</div>
            <p className="text-muted-foreground text-xs">
              plazas cedidas próximas
            </p>
          </CardContent>
        </Card>
      )}

      {/* Plaza hoy */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Plaza hoy</CardTitle>
          <ParkingCircle className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {hasSpotToday ? (spotLabel ?? "Asignada") : "—"}
          </div>
          <p className="text-muted-foreground text-xs">
            {hasSpotToday ? "reservada para hoy" : "sin reserva hoy"}
          </p>
        </CardContent>
      </Card>

      {/* Reservas este mes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Este mes</CardTitle>
          <CheckCircle className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reservationsThisMonth}</div>
          <p className="text-muted-foreground text-xs">
            días reservados en {monthName()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function monthName(): string {
  return new Date().toLocaleDateString("es-ES", { month: "long" });
}
