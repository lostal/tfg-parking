/**
 * Settings - Notifications Page
 *
 * Notification preferences and settings.
 */

import { requireAuth } from "@/lib/supabase/auth";
import { getUserProfileWithPreferences } from "@/lib/queries/preferences";
import { redirect } from "next/navigation";
import { NotificationsForm } from "../components/notifications-form";
import { ContentSection } from "../components/content-section";

export default async function SettingsNotificationsPage() {
  const user = await requireAuth();

  // Fetch user profile with preferences
  const data = await getUserProfileWithPreferences(user.id);

  if (!data || !data.preferences) {
    redirect("/dashboard");
  }

  const { preferences, microsoftStatus } = data;

  return (
    <ContentSection
      title="Notificaciones"
      desc="Configura cómo y cuándo quieres recibir notificaciones."
    >
      <NotificationsForm
        preferences={preferences}
        microsoftConnected={microsoftStatus?.connected || false}
      />
    </ContentSection>
  );
}
