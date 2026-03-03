/**
 * Parking Page – Vista unificada de calendario
 *
 * Empleado sin plaza asignada: reservar plazas por día.
 * Empleado/admin con plaza asignada: ceder su plaza de parking.
 */

import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { requireAuth } from "@/lib/supabase/auth";
import { getSpots } from "@/lib/queries/spots";
import { ParkingCalendarView } from "./_components/parking-calendar-view";
import { getResourceConfig } from "@/lib/config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";

export default async function ParkingPage() {
  const user = await requireAuth();

  const [spots, bookingEnabled] = await Promise.all([
    getSpots("parking"),
    getResourceConfig("parking", "booking_enabled"),
  ]);
  const assignedParkingSpot =
    spots.find((s) => s.assigned_to === user.id) ?? null;

  const title = "Parking";
  const description = assignedParkingSpot
    ? `Cede tu plaza asignada (${assignedParkingSpot.label}) los días que no la uses`
    : "Consulta la disponibilidad y reserva tu plaza";

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="mx-auto max-w-lg">
          {!bookingEnabled && (
            <Alert variant="destructive" className="mb-6">
              <TriangleAlert className="size-4" />
              <AlertTitle>Reservas deshabilitadas</AlertTitle>
              <AlertDescription>
                El administrador ha desactivado temporalmente las nuevas
                reservas de parking.
              </AlertDescription>
            </Alert>
          )}
          <ParkingCalendarView
            hasAssignedSpot={!!assignedParkingSpot}
            assignedSpot={assignedParkingSpot}
          />
        </div>
      </Main>
    </>
  );
}
