"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Theme Provider
 *
 * Wraps the app with next-themes for dark/light/system mode.
 * - `attribute="class"`: Tailwind's `.dark` variant strategy.
 * - `defaultTheme="system"`: Follows OS preference until user chooses.
 * - `enableSystem`: Reacts to OS-level `prefers-color-scheme` changes.
 * - `disableTransitionOnChange`: Prevents flash of wrong styles during switch.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
