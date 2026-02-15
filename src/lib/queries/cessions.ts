/**
 * Cession Queries
 *
 * Server-side functions for reading cession data.
 */

import { createClient } from "@/lib/supabase/server";
import type { Cession } from "@/lib/supabase/types";

/** Cession row with joined spot label and user name */
export interface CessionWithDetails extends Cession {
  spot_label: string;
  user_name: string;
}

/**
 * Get all non-cancelled cessions for a specific date, with spot and user details.
 */
export async function getCessionsByDate(
  date: string
): Promise<CessionWithDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cessions")
    .select(
      "*, spots!cessions_spot_id_fkey(label), profiles!cessions_user_id_fkey(full_name)"
    )
    .eq("date", date)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Error fetching cessions: ${error.message}`);

  return data.map((c) => {
    const spot = c.spots as unknown as { label: string } | null;
    const profile = c.profiles as unknown as { full_name: string } | null;

    return {
      ...c,
      spots: undefined,
      profiles: undefined,
      spot_label: spot?.label ?? "",
      user_name: profile?.full_name ?? "",
    } as CessionWithDetails;
  });
}

/**
 * Get upcoming non-cancelled cessions for a specific user.
 * Returns cessions from today onwards, ordered by date.
 */
export async function getUserCessions(
  userId: string
): Promise<CessionWithDetails[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("cessions")
    .select(
      "*, spots!cessions_spot_id_fkey(label), profiles!cessions_user_id_fkey(full_name)"
    )
    .eq("user_id", userId)
    .neq("status", "cancelled")
    .gte("date", today)
    .order("date");

  if (error) throw new Error(`Error fetching user cessions: ${error.message}`);

  return data.map((c) => {
    const spot = c.spots as unknown as { label: string } | null;
    const profile = c.profiles as unknown as { full_name: string } | null;

    return {
      ...c,
      spots: undefined,
      profiles: undefined,
      spot_label: spot?.label ?? "",
      user_name: profile?.full_name ?? "",
    } as CessionWithDetails;
  });
}
