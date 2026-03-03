/**
 * Admin Users Page
 *
 * Tabla de usuarios con gestión de roles y asignación de plazas
 * para usuarios de dirección. Diseño inspirado en shadcn-admin.
 */

import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { getProfiles } from "@/lib/queries/profiles";
import { getSpots } from "@/lib/queries/spots";
import { UsersTable } from "./components/users-table";
import { UsersProvider } from "./components/users-provider";
import { UsersDialogs } from "./components/users-dialogs";

export default async function AdminUsersPage() {
  const [profiles, parkingSpots, officeSpots] = await Promise.all([
    getProfiles(),
    getSpots("parking"),
    getSpots("office"),
  ]);

  // Spots standard (excluye visitor) → administrables y asignables a usuarios
  const assignedParkingSpots = parkingSpots.filter(
    (s) => s.type === "standard"
  );
  const assignedOfficeSpots = officeSpots.filter((s) => s.type === "standard");

  return (
    <UsersProvider>
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
            <h2 className="text-2xl font-bold tracking-tight">Usuarios</h2>
            <p className="text-muted-foreground text-sm">
              Gestiona los usuarios y asigna plazas de parking y puestos de
              oficina.
            </p>
          </div>
        </div>
        <UsersTable
          profiles={profiles}
          assignedParkingSpots={assignedParkingSpots}
          assignedOfficeSpots={assignedOfficeSpots}
        />
      </Main>
      <UsersDialogs />
    </UsersProvider>
  );
}
