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
  User,
  Bell,
  Cloud,
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
          title: "Ajustes",
          icon: Settings,
          items: [
            {
              title: "Perfil",
              url: ROUTES.SETTINGS_PROFILE,
              icon: User,
            },
            {
              title: "Notificaciones",
              url: ROUTES.SETTINGS_NOTIFICATIONS,
              icon: Bell,
            },
            {
              title: "Preferencias",
              url: ROUTES.SETTINGS_PREFERENCES,
              icon: Settings,
            },
            {
              title: "Microsoft 365",
              url: ROUTES.SETTINGS_MICROSOFT,
              icon: Cloud,
            },
            {
              title: "Seguridad",
              url: ROUTES.SETTINGS_SECURITY,
              icon: Shield,
            },
          ],
        },
      ],
    },
  ],
};
