"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Theme Provider
 *
 * Wraps the app with next-themes for dark/light mode.
 * Uses class strategy to match Tailwind's .dark variant.
 */
export function ThemeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light">
      {children}
    </NextThemesProvider>
  );
}
