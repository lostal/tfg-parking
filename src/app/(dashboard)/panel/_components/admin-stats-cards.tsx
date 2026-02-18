/**
 * AdminStatsCards
 *
 * Four summary stat cards for the admin dashboard.
 * Shows system-wide KPIs: free spots, occupancy %, monthly reservations, active users.
 * Follows the exact shadcn-admin stats card pattern.
 */

import { ParkingCircle, TrendingUp, CalendarDays, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminStatsCardsProps {
  freeSpots: number;
  totalSpots: number;
  occupancyPercent: number;
  monthlyReservations: number;
  activeUsersMonth: number;
}

export function AdminStatsCards({
  freeSpots,
  totalSpots,
  occupancyPercent,
  monthlyReservations,
  activeUsersMonth,
}: AdminStatsCardsProps) {
  const usedSpots = totalSpots - freeSpots;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Plazas libres hoy */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Plazas libres hoy
          </CardTitle>
          <ParkingCircle className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{freeSpots}</div>
          <p className="text-muted-foreground text-xs">
            de {totalSpots} plazas totales
          </p>
        </CardContent>
      </Card>

      {/* Ocupación hoy */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ocupación hoy</CardTitle>
          <TrendingUp className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{occupancyPercent}%</div>
          <p className="text-muted-foreground text-xs">
            {usedSpots} de {totalSpots} plazas ocupadas
          </p>
        </CardContent>
      </Card>

      {/* Reservas este mes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Reservas este mes
          </CardTitle>
          <CalendarDays className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{monthlyReservations}</div>
          <p className="text-muted-foreground text-xs">reservas confirmadas</p>
        </CardContent>
      </Card>

      {/* Usuarios activos este mes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Usuarios activos
          </CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeUsersMonth}</div>
          <p className="text-muted-foreground text-xs">
            han reservado este mes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
