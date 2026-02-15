/**
 * Profile Queries
 *
 * Server-side functions for reading user profile data.
 */

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

/**
 * Get all user profiles, ordered by full name.
 * Used by the admin panel for user/role management.
 */
export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  if (error) throw new Error(`Error fetching profiles: ${error.message}`);

  return data;
}
