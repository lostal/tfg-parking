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
  const [profiles, spots] = await Promise.all([getProfiles(), getSpots()]);

  const managementSpots = spots.filter((s) => s.type === "management");

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
              Gestiona los usuarios y asigna plazas a los usuarios de dirección.
            </p>
          </div>
        </div>
        <UsersTable profiles={profiles} managementSpots={managementSpots} />
      </Main>
      <UsersDialogs />
    </UsersProvider>
  );
}
