/**
 * Layout Type Definitions
 *
 * Defines the navigation data structure used by the sidebar.
 * Adapted from shadcn-admin for Next.js App Router.
 */

import type { UserRole } from "@/lib/supabase/types";

type BaseNavItem = {
  title: string;
  badge?: string;
  icon?: React.ElementType;
  /** If set, only users with one of these roles will see this item */
  roles?: UserRole[];
};

type NavLink = BaseNavItem & {
  url: string;
  items?: never;
};

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { url: string })[];
  url?: never;
};

type NavItem = NavCollapsible | NavLink;

type NavGroup = {
  title: string;
  items: NavItem[];
};

type SidebarData = {
  navGroups: NavGroup[];
};

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink };
