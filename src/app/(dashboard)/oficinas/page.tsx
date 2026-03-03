/**
 * Oficinas Page – Vista de calendario de puestos de trabajo
 *
 * Sin puesto asignado: reserva puestos por día (con o sin franja horaria).
 * Con puesto asignado (assigned_to != null): cede su puesto los días que no lo use.
 */

import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getAllResourceConfigs } from "@/lib/config";
import { OfficeCalendarView } from "./_components/office-calendar-view";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";

export default async function OficinasPage() {
  const user = await requireAuth();

  const supabase = await createClient();
  const [assignedSpotResult, officeConfig] = await Promise.all([
    supabase
      .from("spots")
      .select("id, label")
      .eq("assigned_to", user.id)
      .eq("resource_type", "office")
      .maybeSingle(),
    getAllResourceConfigs("office"),
  ]);
  const assignedSpot = assignedSpotResult.data;
  const {
    booking_enabled: bookingEnabled,
    time_slots_enabled: timeSlotsEnabled,
  } = officeConfig;

  const title = "Oficinas";
  const description = assignedSpot
    ? `Cede tu puesto asignado (${assignedSpot.label}) los días que no lo uses`
    : "Consulta la disponibilidad y reserva tu puesto de trabajo";

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
                reservas de oficinas.
              </AlertDescription>
            </Alert>
          )}
          <OfficeCalendarView
            hasAssignedSpot={!!assignedSpot}
            assignedSpot={assignedSpot ?? null}
            timeSlotsEnabled={Boolean(timeSlotsEnabled)}
          />
        </div>
      </Main>
    </>
  );
}
