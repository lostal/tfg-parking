/**
 * Settings Page
 *
 * User preferences: notifications, parking, Microsoft 365 integration, appearance, security
 */

import { requireAuth } from "@/lib/supabase/auth";
import { getUserProfileWithPreferences } from "@/lib/queries/preferences";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsLayout } from "./components/settings-layout";

export const metadata = {
  title: "Ajustes - Parking GRUPOSIETE",
  description: "Configura tus preferencias y ajustes de la aplicación",
};

export default async function SettingsPage() {
  const user = await requireAuth();

  // Fetch user profile with preferences
  const data = await getUserProfileWithPreferences(user.id);

  if (!data || !data.profile || !data.preferences) {
    redirect("/dashboard");
  }

  const { profile, preferences, microsoftStatus, managementSpot } = data;

  // Fetch available spots for favorites selection
  const supabase = await createClient();
  const { data: spots } = await supabase
    .from("spots")
    .select("id, label")
    .eq("is_active", true)
    .order("label");

  const availableSpots = spots || [];

  return (
    <SettingsLayout
      profile={profile}
      preferences={preferences}
      microsoftStatus={microsoftStatus}
      managementSpot={managementSpot}
      availableSpots={availableSpots}
    />
  );
}
