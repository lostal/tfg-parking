/**
 * My Cessations Page (Management/Admin)
 *
 * Desktop-optimized view for managing parking spot cessions.
 * Users can cede their assigned spot for multiple dates and manage active cessions.
 */

import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { requireManagement } from "@/lib/supabase/auth";
import { getSpots } from "@/lib/queries/spots";
import { getUserCessions } from "@/lib/queries/cessions";
import { CessionsView } from "./_components/cessations-view";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default async function MyCessationsPage() {
  const user = await requireManagement();

  // Get user's assigned spot
  const spots = await getSpots();
  const mySpot = spots.find((s) => s.assigned_to === user.id);

  // Get user's active cessions
  const cessions = await getUserCessions(user.id);

  // User must have an assigned management spot
  if (!mySpot) {
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
            <h2 className="text-2xl font-bold tracking-tight">Mis Cesiones</h2>
            <p className="text-muted-foreground">
              Gestiona las cesiones de tu plaza asignada
            </p>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No tienes una plaza asignada. Contacta con el administrador para
              que te asigne una plaza de dirección.
            </AlertDescription>
          </Alert>
        </Main>
      </>
    );
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Mis Cesiones</h2>
          <p className="text-muted-foreground">
            Gestiona las cesiones de tu plaza {mySpot.label}
          </p>
        </div>

        <CessionsView spot={mySpot} initialCessions={cessions} />
      </Main>
    </>
  );
}
