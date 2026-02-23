/**
 * ThemeSwitch Component
 *
 * Dropdown menu to switch between light, dark and system themes.
 * Persists the selection in next-themes (localStorage) and in the DB.
 * Based on shadcn-admin ThemeSwitch pattern.
 */

"use client";

import { useEffect } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateTheme } from "@/app/(dashboard)/ajustes/actions";

export function ThemeSwitch() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  /* Update theme-color meta tag when resolved theme changes */
  useEffect(() => {
    const themeColor = resolvedTheme === "dark" ? "#1a1f23" : "#fff";
    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) metaThemeColor.setAttribute("content", themeColor);
  }, [resolvedTheme]);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    void updateTheme({ theme: newTheme });
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="scale-95 rounded-full">
          <Sun className="size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          Claro{" "}
          <Check
            size={14}
            className={cn("ms-auto", theme !== "light" && "hidden")}
          />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          Oscuro
          <Check
            size={14}
            className={cn("ms-auto", theme !== "dark" && "hidden")}
          />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          Sistema
          <Check
            size={14}
            className={cn("ms-auto", theme !== "system" && "hidden")}
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
