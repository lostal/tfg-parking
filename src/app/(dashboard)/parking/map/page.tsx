/**
 * Parking Map Page (Employee)
 *
 * Interactive map view for visualizing parking spots.
 * Only accessible to employees - management users are redirected to cessations.
 */

import { redirect } from "next/navigation";
import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { requireAuth } from "@/lib/supabase/auth";
import { ROUTES } from "@/lib/constants";
import { ComingSoon } from "@/components/coming-soon";

export default async function ParkingMapPage() {
  const user = await requireAuth();

  // Redirect management/admin to cessations view (they have assigned spots)
  if (user.profile?.role === "management" || user.profile?.role === "admin") {
    redirect(ROUTES.PARKING_CESSATIONS);
  }

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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Mapa</h2>
            <p className="text-muted-foreground">
              Vista del plano del parking con disponibilidad en tiempo real
            </p>
          </div>
        </div>

        <ComingSoon
          title="Mapa interactivo"
          description="La vista de mapa interactivo estará disponible próximamente. Por ahora, usa la vista de Reservas para gestionar tus plazas."
        />
      </Main>
    </>
  );
}
