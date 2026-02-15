/**
 * Sidebar Navigation Data
 *
 * Defines the navigation structure for the app sidebar.
 * Items are grouped by section and support icons, badges, and sub-items.
 */

import {
  LayoutDashboard,
  Car,
  Calendar,
  Users,
  Shield,
  Settings,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { type SidebarData } from "../types";

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Dashboard",
          url: ROUTES.DASHBOARD,
          icon: LayoutDashboard,
        },
        {
          title: "Parking",
          url: ROUTES.PARKING,
          icon: Car,
        },
        {
          title: "Calendario",
          url: ROUTES.CALENDAR,
          icon: Calendar,
        },
        {
          title: "Visitantes",
          url: ROUTES.VISITORS,
          icon: Users,
        },
      ],
    },
    {
      title: "Gestión",
      items: [
        {
          title: "Administración",
          url: ROUTES.ADMIN,
          icon: Shield,
          roles: ["admin"],
        },
        {
          title: "Configuración",
          url: ROUTES.SETTINGS,
          icon: Settings,
        },
      ],
    },
  ],
};
