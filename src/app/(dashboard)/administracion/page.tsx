import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { getSpots } from "@/lib/queries/spots";
import { getProfiles } from "@/lib/queries/profiles";
import { SpotsProvider } from "./components/spots-provider";
import { SpotsTable } from "./components/spots-table";
import { SpotsDialogs } from "./components/spots-dialogs";
import { SpotsPrimaryButtons } from "./components/spots-primary-buttons";

export default async function AdminPage() {
  const [spots, profiles] = await Promise.all([getSpots(), getProfiles()]);

  return (
    <SpotsProvider>
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
            <h2 className="text-2xl font-bold tracking-tight">Plazas</h2>
            <p className="text-muted-foreground text-sm">
              Gestiona las plazas de aparcamiento del parking.
            </p>
          </div>
          <SpotsPrimaryButtons />
        </div>
        <SpotsTable spots={spots} profiles={profiles} />
      </Main>
      <SpotsDialogs />
    </SpotsProvider>
  );
}
