/**
 * StatsCards Component
 *
 * Four summary stat cards following the shadcn-admin dashboard pattern.
 * Displays at a glance: free spots, next reservation, ceded spots, visitors.
 */

import { ParkingCircle, CalendarDays, Repeat, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  freeSpots: number;
  totalSpots: number;
  nextReservation: { spotLabel: string; date: string } | null;
  cededSpots: number;
  visitorsToday: number;
}

export function StatsCards({
  freeSpots,
  totalSpots,
  nextReservation,
  cededSpots,
  visitorsToday,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Tu próxima reserva
          </CardTitle>
          <CalendarDays className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {nextReservation ? nextReservation.spotLabel : "—"}
          </div>
          <p className="text-muted-foreground text-xs">
            {nextReservation ? nextReservation.date : "Sin reservas próximas"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Plazas cedidas hoy
          </CardTitle>
          <Repeat className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cededSpots}</div>
          <p className="text-muted-foreground text-xs">
            disponibles por cesión
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Visitantes hoy</CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{visitorsToday}</div>
          <p className="text-muted-foreground text-xs">reservas de visitante</p>
        </CardContent>
      </Card>
    </div>
  );
}
