/**
 * Parking Page – Vista unificada de calendario
 *
 * Sirve a todos los roles desde una única ruta (/reservas).
 * Empleado: reservar plazas por día.
 * Directivo: ceder su plaza asignada.
 */

import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { requireAuth } from "@/lib/supabase/auth";
import { getSpots } from "@/lib/queries/spots";
import { ParkingCalendarView } from "./_components/parking-calendar-view";

export default async function ParkingPage() {
  const user = await requireAuth();

  const role = user.profile?.role ?? "employee";
  const isManagement = role === "management" || role === "admin";

  let assignedSpot = null;
  if (isManagement) {
    const spots = await getSpots();
    assignedSpot = spots.find((s) => s.assigned_to === user.id) ?? null;
  }

  const title = isManagement ? "Mis Cesiones" : "Parking";
  const description = isManagement
    ? `Cede tu plaza asignada${assignedSpot ? ` (${assignedSpot.label})` : ""} los días que no la uses`
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
          <ParkingCalendarView
            role={isManagement ? "management" : "employee"}
            assignedSpot={assignedSpot}
          />
        </div>
      </Main>
    </>
  );
}
