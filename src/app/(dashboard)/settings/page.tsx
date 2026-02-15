/**
 * Settings Page
 *
 * User preferences: notification settings, alert subscriptions.
 */

"use client";

import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ComingSoon } from "@/components/coming-soon";

export default function SettingsPage() {
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
        <ComingSoon />
      </Main>
    </>
  );
}
