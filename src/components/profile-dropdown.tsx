/**
 * ProfileDropdown Component
 *
 * Header profile avatar with dropdown menu.
 * Shows user info, quick links, and sign out option.
 * Based on shadcn-admin ProfileDropdown pattern.
 *
 * Server wrapper — fetches fresh session data server-side to avoid
 * stale client-side session cache issues after account switches.
 */

import { getCurrentUser } from "@/lib/auth/helpers";
import { ProfileDropdownClient } from "./profile-dropdown-client";

export async function ProfileDropdown() {
  const user = await getCurrentUser();

  return (
    <ProfileDropdownClient
      displayName={user?.profile?.fullName ?? ""}
      email={user?.email ?? ""}
      role={user?.profile?.role ?? null}
    />
  );
}
