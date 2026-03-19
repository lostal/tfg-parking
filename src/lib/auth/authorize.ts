/**
 * Authorization Functions
 *
 * Composable server-side authorization checks that replace Supabase RLS policies.
 * These functions throw or redirect — they are meant to be called at the
 * beginning of server actions and query functions.
 */

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { db } from "@/lib/db";
import { spots } from "@/lib/db/schema";
import type { Profile } from "@/lib/db/types";

type SessionUser = {
  id: string;
  role: string;
  entityId: string | null;
};

/**
 * Asserts the user is authenticated. Throws if not.
 */
export function assertAuthenticated(
  user: SessionUser | null | undefined
): asserts user is SessionUser {
  if (!user) {
    redirect(ROUTES.LOGIN);
  }
}

/**
 * Asserts the user has admin role.
 */
export function assertAdmin(user: SessionUser): void {
  if (user.role !== "admin") {
    redirect(ROUTES.PARKING);
  }
}

/**
 * Asserts the user has HR or admin role.
 */
export function assertHROrAbove(user: SessionUser): void {
  if (user.role !== "hr" && user.role !== "admin") {
    redirect(ROUTES.PARKING);
  }
}

/**
 * Asserts the user has manager, HR, or admin role.
 */
export function assertManagerOrAbove(user: SessionUser): void {
  const { role } = user;
  if (role !== "manager" && role !== "hr" && role !== "admin") {
    redirect(ROUTES.PARKING);
  }
}

/**
 * Asserts the user owns the resource (or is admin).
 */
export function assertOwner(user: SessionUser, resourceUserId: string): void {
  if (user.role === "admin") return;
  if (user.id !== resourceUserId) {
    redirect(ROUTES.PARKING);
  }
}

/**
 * Asserts the user has an assigned spot of the given type (or is admin).
 */
export async function assertHasAssignedSpot(
  user: SessionUser,
  resourceType: "parking" | "office"
): Promise<void> {
  if (user.role === "admin") return;

  const [spot] = await db
    .select({ id: spots.id })
    .from(spots)
    .where(
      and(eq(spots.assignedTo, user.id), eq(spots.resourceType, resourceType))
    )
    .limit(1);

  if (!spot) {
    redirect(resourceType === "parking" ? ROUTES.PARKING : ROUTES.OFFICES);
  }
}

/**
 * Asserts the user can manage a reservation (owner or admin).
 */
export function assertCanManageReservation(
  user: SessionUser,
  reservationUserId: string
): void {
  if (user.role === "admin") return;
  if (user.id !== reservationUserId) {
    redirect(ROUTES.PARKING);
  }
}

/**
 * Checks if a profile belongs to the same entity as the user (or user is admin).
 */
export function assertSameEntity(
  user: SessionUser,
  targetEntityId: string | null
): void {
  if (user.role === "admin") return;
  if (user.entityId !== targetEntityId) {
    redirect(ROUTES.PARKING);
  }
}

/**
 * Non-throwing role checks for conditional logic.
 */
export function isAdmin(profile: Pick<Profile, "role"> | null): boolean {
  return profile?.role === "admin";
}

export function isHROrAbove(profile: Pick<Profile, "role"> | null): boolean {
  return profile?.role === "hr" || profile?.role === "admin";
}

export function isManagerOrAbove(
  profile: Pick<Profile, "role"> | null
): boolean {
  const role = profile?.role;
  return role === "manager" || role === "hr" || role === "admin";
}
