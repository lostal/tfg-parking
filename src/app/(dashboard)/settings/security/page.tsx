/**
 * Settings - Security Page
 *
 * Security settings and account information.
 */

import { requireAuth } from "@/lib/supabase/auth";
import { getUserProfileWithPreferences } from "@/lib/queries/preferences";
import { redirect } from "next/navigation";
import { SecuritySection } from "../components/security-section";

export default async function SettingsSecurityPage() {
  const user = await requireAuth();

  // Fetch user profile with preferences
  const data = await getUserProfileWithPreferences(user.id);

  if (!data || !data.profile) {
    redirect("/dashboard");
  }

  const { profile } = data;

  return (
    <SecuritySection
      user={{
        email: profile.email,
        created_at: profile.created_at,
      }}
    />
  );
}
