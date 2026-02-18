/**
 * Settings - Microsoft 365 Page
 *
 * Microsoft 365 integration and Outlook sync settings.
 */

import { requireAuth } from "@/lib/supabase/auth";
import { getUserProfileWithPreferences } from "@/lib/queries/preferences";
import { redirect } from "next/navigation";
import { MicrosoftConnectionCard } from "../components/microsoft-connection-card";
import { OutlookSyncForm } from "../components/outlook-sync-form";
import { ManagementCessionRules } from "../components/management-cession-rules";
import { ContentSection } from "../components/content-section";

export default async function SettingsMicrosoftPage() {
  const user = await requireAuth();

  // Fetch user profile with preferences
  const data = await getUserProfileWithPreferences(user.id);

  if (!data || !data.profile || !data.preferences) {
    redirect("/panel");
  }

  const { profile, preferences, microsoftStatus, managementSpot } = data;

  return (
    <ContentSection
      title="Integración con Microsoft 365"
      desc="Conecta tu cuenta de Microsoft 365 y sincroniza tu calendario de Outlook."
    >
      <div className="space-y-6">
        <MicrosoftConnectionCard status={microsoftStatus} />
        <OutlookSyncForm
          preferences={preferences}
          microsoftConnected={microsoftStatus?.connected || false}
          lastSync={microsoftStatus?.lastSync || null}
        />
        {(profile.role === "management" || profile.role === "admin") && (
          <ManagementCessionRules
            preferences={preferences}
            spotInfo={managementSpot}
            microsoftConnected={microsoftStatus?.connected || false}
          />
        )}
      </div>
    </ContentSection>
  );
}
