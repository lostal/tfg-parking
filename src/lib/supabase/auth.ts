/**
 * Authentication Helpers
 *
 * Server-side auth utilities for user verification and authorization.
 * These functions run on the server and handle redirects automatically.
 *
 * Usage:
 *   - getCurrentUser() - Returns user + profile or null if not authenticated
 *   - requireAuth() - Returns user + profile or redirects to /login
 *   - requireAdmin() - Returns admin user or redirects to /dashboard
 *   - requireManagement() - Returns management/admin user or redirects
 */

import { redirect } from "next/navigation";
import { createClient } from "./server";
import { ROUTES } from "@/lib/constants";
import type { Profile, UserRole } from "./types";

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

/**
 * Get the current authenticated user with their profile
 * @returns User object with profile or null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Fetch user profile with role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    profile: profile ?? null,
  };
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in protected layouts/pages
 * @returns Authenticated user with profile
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  return user;
}

/**
 * Require admin role - redirects to dashboard if not admin
 * Use this in admin-only pages/layouts
 * @returns Admin user with profile
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();

  if (user.profile?.role !== "admin") {
    redirect(ROUTES.DASHBOARD);
  }

  return user;
}

/**
 * Require management or admin role
 * Use this for features like cession management
 * @returns Management/admin user with profile
 */
export async function requireManagement(): Promise<AuthUser> {
  const user = await requireAuth();

  const allowedRoles: UserRole[] = ["admin", "management"];

  if (!user.profile?.role || !allowedRoles.includes(user.profile.role)) {
    redirect(ROUTES.DASHBOARD);
  }

  return user;
}
