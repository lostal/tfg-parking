/**
 * ThemeSwitch Component
 *
 * Single-click toggle between light and dark theme.
 * Persists the selection in next-themes (localStorage) and in the DB.
 */

"use client";

import { useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { updateTheme } from "@/app/(dashboard)/ajustes/actions";

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();

  /* Update theme-color meta tag when theme is updated */
  useEffect(() => {
    const themeColor = theme === "dark" ? "#1a1f23" : "#fff";
    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) metaThemeColor.setAttribute("content", themeColor);
  }, [theme]);

  const handleToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    void updateTheme({ theme: newTheme });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="scale-95 rounded-full"
      onClick={handleToggle}
    >
      <Sun className="size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Cambiar tema</span>
    </Button>
  );
}
