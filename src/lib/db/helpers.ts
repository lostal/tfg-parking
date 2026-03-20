/**
 * Database Type Helpers
 *
 * Provides validated types and helper functions to bridge between
 * database types (generic strings) and application types (literal unions)
 */

import type { UserPreferences } from "./types";

// ─── Validated Preferences Type ──────────────────────────────

export type ValidatedUserPreferences = Omit<
  UserPreferences,
  | "theme"
  | "locale"
  | "defaultView"
  | "notificationChannel"
  | "favoriteSpotIds"
  | "autoCedeDays"
> & {
  theme: "light" | "dark" | "system";
  locale: "es" | "en";
  defaultView: "map" | "list" | "calendar";
  notificationChannel: "teams" | "email" | "both";
  favoriteSpotIds: string[];
  autoCedeDays: number[];
};

// ─── Validation Helpers ──────────────────────────────────────

function isValidTheme(theme: string): theme is "light" | "dark" | "system" {
  return ["light", "dark", "system"].includes(theme);
}

function isValidLocale(locale: string): locale is "es" | "en" {
  return ["es", "en"].includes(locale);
}

function isValidView(view: string): view is "map" | "list" | "calendar" {
  return ["map", "list", "calendar"].includes(view);
}

function isValidChannel(
  channel: string
): channel is "teams" | "email" | "both" {
  return ["teams", "email", "both"].includes(channel);
}

/**
 * Validates and converts database user preferences to application types.
 * Provides safe defaults for nullable fields.
 */
export function validateUserPreferences(
  prefs: UserPreferences
): ValidatedUserPreferences {
  const theme = isValidTheme(prefs.theme) ? prefs.theme : "system";
  const locale = isValidLocale(prefs.locale) ? prefs.locale : "es";
  const defaultView = isValidView(prefs.defaultView)
    ? prefs.defaultView
    : "map";
  const notificationChannel = isValidChannel(prefs.notificationChannel)
    ? prefs.notificationChannel
    : "teams";

  const favoriteSpotIds = prefs.favoriteSpotIds || [];
  const autoCedeDays = prefs.autoCedeDays || [];

  return {
    ...prefs,
    theme,
    locale,
    defaultView,
    notificationChannel,
    favoriteSpotIds,
    autoCedeDays,
  };
}
