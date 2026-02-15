/**
 * Dashboard Home Page
 *
 * Currently shows a placeholder.
 * Will display stats cards and real-time parking data.
 */

"use client";

import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { Header, Main, TopNav } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ComingSoon } from "@/components/coming-soon";

export default function DashboardPage() {
  const pathname = usePathname();
  return (
    <>
      <Header fixed>
        <TopNav
          links={[
            {
              title: "Dashboard",
              href: ROUTES.DASHBOARD,
              isActive: pathname === ROUTES.DASHBOARD,
            },
            {
              title: "Parking",
              href: ROUTES.PARKING,
              isActive: pathname === ROUTES.PARKING,
            },
            {
              title: "Calendario",
              href: ROUTES.CALENDAR,
              isActive: pathname === ROUTES.CALENDAR,
            },
            {
              title: "Visitantes",
              href: ROUTES.VISITORS,
              isActive: pathname === ROUTES.VISITORS,
            },
          ]}
        />
        <div className="ml-auto flex items-center gap-2">
          <Search />
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
