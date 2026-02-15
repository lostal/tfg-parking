/**
 * Settings - Preferences Page
 *
 * App preferences: theme and parking view settings.
 */

import { requireAuth } from "@/lib/supabase/auth";
import { getUserProfileWithPreferences } from "@/lib/queries/preferences";
import { redirect } from "next/navigation";
import { PreferencesForm } from "../components/preferences-form";

export default async function SettingsPreferencesPage() {
  const user = await requireAuth();

  // Fetch user profile with preferences
  const data = await getUserProfileWithPreferences(user.id);

  if (!data || !data.preferences) {
    redirect("/dashboard");
  }

  const { preferences } = data;

  return <PreferencesForm preferences={preferences} />;
}
