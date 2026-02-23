/**
 * ThemeSync Component
 *
 * Invisible client component that syncs the user's DB theme preference
 * with next-themes on mount. This ensures that when a user logs in on
 * a new device or incognito window, their saved theme is restored.
 *
 * Rendered in the dashboard layout which already has the authenticated user.
 */

"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

type Theme = "light" | "dark" | "system";

interface ThemeSyncProps {
  /** Theme preference from the database */
  dbTheme: Theme;
}

export function ThemeSync({ dbTheme }: ThemeSyncProps) {
  const { setTheme } = useTheme();
  const synced = useRef(false);

  useEffect(() => {
    // Only sync once on initial mount to avoid overriding user's
    // in-session changes (e.g. via navbar dropdown or ⌘K).
    if (!synced.current) {
      setTheme(dbTheme);
      synced.current = true;
    }
  }, [dbTheme, setTheme]);

  return null;
}
