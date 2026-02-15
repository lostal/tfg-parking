/**
 * Supabase Type Helpers
 *
 * Provides validated types and helper functions to bridge between
 * database types (generic strings) and application types (literal unions)
 */

import type { Database } from "./database.types";

// ─── Base Types ──────────────────────────────────────────────

type UserPreferencesRow =
  Database["public"]["Tables"]["user_preferences"]["Row"];

// ─── Validated Preferences Type ──────────────────────────────

export type ValidatedUserPreferences = Omit<
  UserPreferencesRow,
  | "theme"
  | "locale"
  | "default_view"
  | "notification_channel"
  | "favorite_spot_ids"
  | "auto_cede_days"
> & {
  theme: "light" | "dark" | "system";
  locale: "es" | "en";
  default_view: "map" | "list" | "calendar";
  notification_channel: "teams" | "email" | "both";
  favorite_spot_ids: string[];
  auto_cede_days: number[];
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
 * Validates and converts database user preferences to application types
 * Provides safe defaults for nullable fields
 */
export function validateUserPreferences(
  prefs: UserPreferencesRow
): ValidatedUserPreferences {
  // Validate literal types with fallbacks
  const theme = isValidTheme(prefs.theme) ? prefs.theme : "system";
  const locale = isValidLocale(prefs.locale) ? prefs.locale : "es";
  const default_view = isValidView(prefs.default_view)
    ? prefs.default_view
    : "map";
  const notification_channel = isValidChannel(prefs.notification_channel)
    ? prefs.notification_channel
    : "teams";

  // Handle nullable arrays
  const favorite_spot_ids = prefs.favorite_spot_ids || [];
  const auto_cede_days = prefs.auto_cede_days || [];

  return {
    ...prefs,
    theme,
    locale,
    default_view,
    notification_channel,
    favorite_spot_ids,
    auto_cede_days,
  };
}
