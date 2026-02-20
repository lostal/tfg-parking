"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ROUTES } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, Bell, Cloud, Shield, Settings } from "lucide-react";

const settingsSections = [
  { id: "profile", label: "Perfil", icon: User, href: ROUTES.SETTINGS },
  {
    id: "notifications",
    label: "Notificaciones",
    icon: Bell,
    href: ROUTES.SETTINGS_NOTIFICATIONS,
  },
  {
    id: "preferences",
    label: "Preferencias",
    icon: Settings,
    href: ROUTES.SETTINGS_PREFERENCES,
  },
  {
    id: "microsoft",
    label: "Microsoft 365",
    icon: Cloud,
    href: ROUTES.SETTINGS_MICROSOFT,
  },
  {
    id: "security",
    label: "Seguridad",
    icon: Shield,
    href: ROUTES.SETTINGS_SECURITY,
  },
] as const;

export function SettingsSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [val, setVal] = useState(pathname ?? ROUTES.SETTINGS);

  const handleSelect = (href: string) => {
    setVal(href);
    router.push(href);
  };

  return (
    <>
      {/* Mobile: Select Dropdown */}
      <div className="p-1 md:hidden">
        <Select value={val} onValueChange={handleSelect}>
          <SelectTrigger className="h-12 sm:w-48">
            <SelectValue placeholder="Seleccionar sección" />
          </SelectTrigger>
          <SelectContent>
            {settingsSections.map((section) => {
              const Icon = section.icon;
              return (
                <SelectItem key={section.id} value={section.href}>
                  <div className="flex gap-x-4 px-2 py-1">
                    <span className="scale-125">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-md">{section.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Tablet/Desktop: Horizontal ScrollArea → Vertical nav */}
      <ScrollArea
        orientation="horizontal"
        type="always"
        className="bg-background hidden w-full min-w-40 px-1 py-2 md:block"
      >
        <nav className="flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            const isActive = pathname === section.href;
            return (
              <Link
                key={section.id}
                href={section.href}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  isActive
                    ? "bg-muted hover:bg-accent"
                    : "hover:bg-accent hover:underline",
                  "justify-start"
                )}
              >
                <Icon className="me-2 h-4 w-4" />
                {section.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </>
  );
}
