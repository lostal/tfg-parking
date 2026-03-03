import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { getSpots } from "@/lib/queries/spots";
import { getProfiles } from "@/lib/queries/profiles";
import { SpotsProvider } from "./components/spots-provider";
import { SpotsDialogs } from "./components/spots-dialogs";
import { AdminSpotsContent } from "./components/admin-spots-content";

export default async function AdminPage() {
  const [parkingSpots, officeSpots, profiles] = await Promise.all([
    getSpots("parking", true),
    getSpots("office", true),
    getProfiles(),
  ]);

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
        <AdminSpotsContent
          parkingSpots={parkingSpots}
          officeSpots={officeSpots}
          profiles={profiles}
        />
      </Main>
      <SpotsDialogs />
    </SpotsProvider>
  );
}
