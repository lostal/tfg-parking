/**
 * Sidebar Navigation Data
 *
 * Defines the navigation structure for the app sidebar.
 * Items are grouped by section and support icons, badges, and sub-items.
 *
 * Role visibility:
 *   employee   → usuario general
 *   management → usuario de dirección (puede ceder su plaza)
 *   admin      → administrador (no puede reservar para sí mismo)
 */

import {
  LayoutDashboard,
  Car,
  Users,
  Shield,
  Settings,
  User,
  Bell,
  Cloud,
  MapPin,
  ParkingSquare,
  CalendarCheck,
  Repeat2,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { type SidebarData } from "../types";

export const sidebarData: SidebarData = {
  navGroups: [
    {
      title: "General",
      items: [
        {
          title: "Panel",
          url: ROUTES.DASHBOARD,
          icon: LayoutDashboard,
          roles: ["admin"],
        },
        {
          title: "Parking",
          url: ROUTES.PARKING,
          icon: Car,
          // Employees and management can reserve (management only ceded spots)
          roles: ["employee", "management"],
        },
        {
          title: "Mis Reservas",
          url: ROUTES.MIS_RESERVAS,
          icon: CalendarCheck,
          roles: ["employee"],
        },
        {
          title: "Mis Cesiones",
          url: ROUTES.MIS_RESERVAS,
          icon: Repeat2,
          roles: ["management"],
        },
        {
          title: "Mapa",
          url: ROUTES.PARKING_MAP,
          icon: MapPin,
          roles: ["employee"],
        },
        {
          title: "Visitantes",
          url: ROUTES.VISITORS,
          icon: Users,
          // All roles can see visitors; admin is the primary one to manage them
        },
      ],
    },
    {
      title: "Administración",
      items: [
        {
          title: "Plazas",
          url: ROUTES.ADMIN,
          icon: ParkingSquare,
          roles: ["admin"],
        },
        {
          title: "Usuarios",
          url: ROUTES.ADMIN_USERS,
          icon: Users,
          roles: ["admin"],
        },
        {
          title: "Ajustes",
          icon: Settings,
          items: [
            {
              title: "Perfil",
              url: ROUTES.SETTINGS,
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
