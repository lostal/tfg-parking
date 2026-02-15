/**
 * Calendar Page
 *
 * Weekly/monthly view of parking availability.
 * Employees can browse and reserve from here.
 */

"use client";

import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ComingSoon } from "@/components/coming-soon";

export default function CalendarPage() {
  return (
    <>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center gap-2">
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
