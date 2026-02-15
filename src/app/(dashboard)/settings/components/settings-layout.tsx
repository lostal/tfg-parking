"use client";

import { useState } from "react";
import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Separator } from "@/components/ui/separator";
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
      <Main>
        <div className="space-y-6">
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

          <Separator />

          {/* Settings Layout: Sidebar + Content */}
          <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
            {/* Sidebar Navigation */}
            <aside className="lg:w-1/5">
              <nav className="flex space-x-2 lg:flex-col lg:space-y-1 lg:space-x-0">
                {settingsSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        buttonVariants({ variant: "ghost" }),
                        activeSection === section.id
                          ? "bg-muted hover:bg-muted"
                          : "hover:bg-transparent hover:underline",
                        "justify-start whitespace-nowrap"
                      )}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 lg:max-w-2xl">
              <div className="space-y-6">
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
