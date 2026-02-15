/**
 * DashboardTopNav
 *
 * Client component wrapper for the TopNav used in the dashboard header.
 * Needed because usePathname() requires "use client".
 */

"use client";

import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/constants";
import { TopNav } from "@/components/layout";

const links = [
  { title: "Dashboard", href: ROUTES.DASHBOARD },
  { title: "Parking", href: ROUTES.PARKING },
  { title: "Calendario", href: ROUTES.CALENDAR },
  { title: "Visitantes", href: ROUTES.VISITORS },
];

export function DashboardTopNav() {
  const pathname = usePathname();
  return (
    <TopNav
      links={links.map((link) => ({
        ...link,
        isActive: pathname === link.href,
      }))}
    />
  );
}
