/**
 * Settings - Profile Page
 *
 * User profile information and settings.
 */

import { requireAuth } from "@/lib/auth/helpers";
import { getUserProfileWithPreferences } from "@/lib/queries/preferences";
import { redirect } from "next/navigation";
import { ProfileForm } from "../components/profile-form";
import { ContentSection } from "../components/content-section";

export default async function SettingsProfilePage() {
  const user = await requireAuth();

  const data = await getUserProfileWithPreferences(user.id);

  if (!data || !data.profile) {
    redirect("/panel");
  }

  const { profile } = data;
  const profileCompat = {
    id: profile.id,
    email: profile.email,
    full_name: profile.fullName,
    avatar_url: profile.avatarUrl,
    role: profile.role,
  };

  return (
    <ContentSection
      title="Información Personal"
      desc="Actualiza tu información de perfil y foto de usuario."
    >
      <ProfileForm profile={profileCompat} />
    </ContentSection>
  );
}
