/**
 * Application-wide constants
 *
 * Centralized config values, magic strings, and defaults.
 */

/** Maximum days in advance a reservation can be made (configurable via admin) */
export const DEFAULT_MAX_ADVANCE_DAYS = 14;

/** Application metadata */
export const APP_NAME = "GRUPOSIETE Parking";
export const APP_DESCRIPTION =
  "Sistema de gestión de reservas de parking corporativo";

/** Route paths */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  CALLBACK: "/auth/callback",
  DASHBOARD: "/panel",
  /** Home page for non-admin roles (management & employee) */
  INICIO: "/inicio",
  PARKING: "/reservas",
  MIS_RESERVAS: "/mis-reservas",
  PARKING_CESSATIONS: "/reservas/cesiones",
  PARKING_MAP: "/reservas/mapa",
  CALENDAR: "/calendario",
  VISITORS: "/visitantes",
  ADMIN: "/administracion",
  ADMIN_USERS: "/administracion/usuarios",
  SETTINGS: "/ajustes",
  SETTINGS_PROFILE: "/ajustes",
  SETTINGS_NOTIFICATIONS: "/ajustes/notificaciones",
  SETTINGS_PREFERENCES: "/ajustes/preferencias",
  SETTINGS_MICROSOFT: "/ajustes/microsoft",
  SETTINGS_SECURITY: "/ajustes/seguridad",
} as const;

/** External links */
export const EXTERNAL = {
  SEDE_ADDRESS: "Sede GRUPOSIETE, Madrid",
  GOOGLE_MAPS_URL: "",
  WAZE_URL: "",
} as const;
