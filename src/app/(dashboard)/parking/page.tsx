/**
 * Parking Page
 *
 * Interactive 2D SVG map + spot reservation flow.
 * Real-time updates via Supabase Realtime.
 */

"use client";

import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ComingSoon } from "@/components/coming-soon";

export default function ParkingPage() {
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
        <ComingSoon />
      </Main>
    </>
  );
}
