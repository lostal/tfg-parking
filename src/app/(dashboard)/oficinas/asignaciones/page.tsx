import { requireAdmin } from "@/lib/auth/helpers";
import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { getSpots } from "@/lib/queries/spots";
import { getProfiles } from "@/lib/queries/profiles";
import { getEffectiveEntityId } from "@/lib/queries/active-entity";
import { SpotsProvider } from "@/app/(dashboard)/administracion/components/spots-provider";
import { SpotsDialogs } from "@/app/(dashboard)/administracion/components/spots-dialogs";
import { SpotsPrimaryButtons } from "@/app/(dashboard)/administracion/components/spots-primary-buttons";
import { SpotsTable } from "@/app/(dashboard)/administracion/components/spots-table";
import type { Profile, Spot } from "@/lib/supabase/types";

export default async function OficinaAsignacionesPage() {
  await requireAdmin();

  const entityId = await getEffectiveEntityId();

  const [spots, profiles] = await Promise.all([
    getSpots("office", true, entityId),
    getProfiles(entityId),
  ]);

  const spotsCompat: Spot[] = spots.map((spot) => ({
    id: spot.id,
    label: spot.label,
    type: spot.type,
    resource_type: spot.resourceType,
    assigned_to: spot.assignedTo,
    is_active: spot.isActive,
    position_x: spot.positionX,
    position_y: spot.positionY,
    entity_id: spot.entityId,
    created_at: spot.createdAt.toISOString(),
    updated_at: spot.updatedAt.toISOString(),
  }));

  const profilesCompat: Profile[] = profiles.map((profile) => ({
    id: profile.id,
    email: profile.email,
    full_name: profile.fullName,
    avatar_url: profile.avatarUrl,
    role: profile.role,
    entity_id: profile.entityId,
    dni: profile.dni,
    manager_id: profile.managerId,
    job_title: profile.jobTitle,
    phone: profile.phone,
    location: profile.location,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString(),
  }));

  return (
    <SpotsProvider defaultResourceType="office">
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Oficinas — Asignaciones
            </h2>
            <p className="text-muted-foreground text-sm">
              Gestiona los puestos de oficina y sus asignaciones.
            </p>
          </div>
          <SpotsPrimaryButtons />
        </div>
        <SpotsTable spots={spotsCompat} profiles={profilesCompat} />
      </Main>
      <SpotsDialogs />
    </SpotsProvider>
  );
}
