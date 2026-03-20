/**
 * Profile Queries
 *
 * Server-side functions for reading user profile data.
 */

import { db } from "@/lib/db";
import { profiles as profilesTable } from "@/lib/db/schema";
import type { Profile } from "@/lib/db/types";
import { eq, asc } from "drizzle-orm";

/**
 * Get user profiles, ordered by full name.
 * @param entityId - If provided, returns only profiles belonging to that entity.
 */
export async function getProfiles(
  entityId?: string | null
): Promise<Profile[]> {
  const rows = await db
    .select()
    .from(profilesTable)
    .where(entityId ? eq(profilesTable.entityId, entityId) : undefined)
    .orderBy(asc(profilesTable.fullName));

  return rows;
}
