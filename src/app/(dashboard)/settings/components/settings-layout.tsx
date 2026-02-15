"use client";

import { useState } from "react";
import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Separator } from "@/components/ui/separator";
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
import { User, Bell, Car, Cloud, Palette, Shield } from "lucide-react";
import type { Database } from "@/lib/supabase/database.types";
import type { ValidatedUserPreferences } from "@/lib/supabase/helpers";
import { ProfileForm } from "./profile-form";
import { NotificationsForm } from "./notifications-form";
import { ParkingForm } from "./parking-form";
import { MicrosoftConnectionCard } from "./microsoft-connection-card";
import { OutlookSyncForm } from "./outlook-sync-form";
import { ManagementCessionRules } from "./management-cession-rules";
import { AppearanceForm } from "./appearance-form";
import { SecuritySection } from "./security-section";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface MicrosoftStatus {
  connected: boolean;
  scopes: string[];
  lastSync: string | null;
  lastOOOCheck: string | null;
  currentOOOStatus: boolean;
  teamsConnected: boolean;
  outlookConnected: boolean;
}

interface ManagementSpot {
  spot: {
    id: string;
    label: string;
    type: string;
  } | null;
  statusToday: "occupied" | "ceded" | "reserved" | "unknown";
  nextCession: {
    id: string;
    date: string;
    status: string;
  } | null;
}

interface SettingsLayoutProps {
  profile: Profile;
  preferences: ValidatedUserPreferences;
  microsoftStatus: MicrosoftStatus | null;
  managementSpot: ManagementSpot | null;
  availableSpots: Array<{ id: string; label: string }>;
}

const settingsSections = [
  { id: "profile", label: "Perfil", icon: User },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "parking", label: "Parking", icon: Car },
  { id: "microsoft", label: "Microsoft 365", icon: Cloud },
  { id: "appearance", label: "Apariencia", icon: Palette },
  { id: "security", label: "Seguridad", icon: Shield },
] as const;

type SectionId = (typeof settingsSections)[number]["id"];

export function SettingsLayout({
  profile,
  preferences,
  microsoftStatus,
  managementSpot,
  availableSpots,
}: SettingsLayoutProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("profile");

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center gap-2">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main fixed>
        <div className="flex flex-1 flex-col space-y-6 overflow-hidden">
          {/* Page Header */}
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Ajustes
            </h1>
            <p className="text-muted-foreground">
              Gestiona la configuración de tu cuenta y preferencias de la
              aplicación
            </p>
          </div>

          <Separator className="my-4 flex-none lg:my-6" />

          {/* Settings Layout: Sidebar + Content */}
          <div className="flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12">
            {/* Sidebar Navigation */}
            <aside className="top-0 lg:sticky lg:w-1/5">
              {/* Mobile: Select Dropdown */}
              <div className="p-1 md:hidden">
                <Select
                  value={activeSection}
                  onValueChange={(value) => setActiveSection(value as SectionId)}
                >
                  <SelectTrigger className="h-12 sm:w-48">
                    <SelectValue placeholder="Seleccionar sección" />
                  </SelectTrigger>
                  <SelectContent>
                    {settingsSections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <SelectItem key={section.id} value={section.id}>
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
                className="hidden w-full min-w-40 bg-background px-1 py-2 md:block"
              >
                <nav className="flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0">
                  {settingsSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={cn(
                          buttonVariants({ variant: "ghost" }),
                          activeSection === section.id
                            ? "bg-muted hover:bg-accent"
                            : "hover:bg-accent hover:underline",
                          "justify-start"
                        )}
                      >
                        <Icon className="me-2 h-4 w-4" />
                        {section.label}
                      </button>
                    );
                  })}
                </nav>
              </ScrollArea>
            </aside>

            {/* Main Content */}
            <div className="flex w-full overflow-y-hidden p-1">
              <div className="flex-1 space-y-6 lg:max-w-2xl">
                {activeSection === "profile" && (
                  <ProfileForm profile={profile} />
                )}

                {activeSection === "notifications" && (
                  <NotificationsForm
                    preferences={preferences}
                    microsoftConnected={microsoftStatus?.connected || false}
                  />
                )}

                {activeSection === "parking" && (
                  <ParkingForm
                    preferences={preferences}
                    availableSpots={availableSpots}
                  />
                )}

                {activeSection === "microsoft" && (
                  <>
                    <MicrosoftConnectionCard status={microsoftStatus} />
                    <OutlookSyncForm
                      preferences={preferences}
                      microsoftConnected={microsoftStatus?.connected || false}
                      lastSync={microsoftStatus?.lastSync || null}
                    />
                    {(profile.role === "management" ||
                      profile.role === "admin") && (
                      <ManagementCessionRules
                        preferences={preferences}
                        spotInfo={managementSpot}
                        microsoftConnected={microsoftStatus?.connected || false}
                      />
                    )}
                  </>
                )}

                {activeSection === "appearance" && (
                  <AppearanceForm preferences={preferences} />
                )}

                {activeSection === "security" && (
                  <SecuritySection
                    user={{
                      email: profile.email,
                      created_at: profile.created_at,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </Main>
    </>
  );
}
