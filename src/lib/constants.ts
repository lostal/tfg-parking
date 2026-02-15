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
  DASHBOARD: "/dashboard",
  PARKING: "/parking",
  CALENDAR: "/calendar",
  VISITORS: "/visitors",
  ADMIN: "/admin",
  SETTINGS: "/settings",
  SETTINGS_PROFILE: "/settings",
  SETTINGS_NOTIFICATIONS: "/settings/notifications",
  SETTINGS_PREFERENCES: "/settings/preferences",
  SETTINGS_MICROSOFT: "/settings/microsoft",
  SETTINGS_SECURITY: "/settings/security",
} as const;

/** External links */
export const EXTERNAL = {
  SEDE_ADDRESS: "Sede GRUPOSIETE, Madrid",
  GOOGLE_MAPS_URL: "",
  WAZE_URL: "",
} as const;
