/**
 * AppSidebar Component
 *
 * Main sidebar using shadcn/ui Sidebar with data-driven navigation.
 * Filters nav items based on user role.
 * Based on shadcn-admin AppSidebar pattern.
 */

"use client";

import { useMemo } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { sidebarData } from "./data/sidebar-data";
import { AppTitle } from "./app-title";
import { NavGroup } from "./nav-group";
import { NavUser } from "./nav-user";
import { ROUTES } from "@/lib/constants";
import type { UserRole } from "@/lib/supabase/types";

interface AppSidebarProps {
  role: UserRole;
  /** Ocultar la sección de visitantes cuando visitor_booking_enabled=false */
  visitorBookingEnabled?: boolean;
}

export function AppSidebar({
  role,
  visitorBookingEnabled = true,
}: AppSidebarProps) {
  const filteredNavGroups = useMemo(() => {
    return sidebarData.navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!(!item.roles || item.roles.includes(role))) return false;
          // Ocultar Visitantes si visitor_booking_enabled está desactivado
          if (
            !visitorBookingEnabled &&
            "url" in item &&
            item.url === ROUTES.VISITORS
          )
            return false;
          return true;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [role, visitorBookingEnabled]);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <AppTitle />
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
