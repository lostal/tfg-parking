/**
 * Reservation Queries
 *
 * Server-side functions for reading reservation data.
 */

import { createClient } from "@/lib/supabase/server";
import type { Reservation } from "@/lib/supabase/types";

/** Reservation row with joined spot label and user name */
export interface ReservationWithDetails extends Reservation {
  spot_label: string;
  user_name: string;
}

/**
 * Get all confirmed reservations for a specific date, with spot and user details.
 */
export async function getReservationsByDate(
  date: string
): Promise<ReservationWithDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reservations")
    .select(
      "*, spots!reservations_spot_id_fkey(label), profiles!reservations_user_id_fkey(full_name)"
    )
    .eq("date", date)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Error fetching reservations: ${error.message}`);

  return data.map((r) => {
    const spot = r.spots as unknown as { label: string } | null;
    const profile = r.profiles as unknown as { full_name: string } | null;

    return {
      ...r,
      spots: undefined,
      profiles: undefined,
      spot_label: spot?.label ?? "",
      user_name: profile?.full_name ?? "",
    } as ReservationWithDetails;
  });
}

/**
 * Get upcoming confirmed reservations for a specific user.
 * Returns reservations from today onwards, ordered by date.
 */
export async function getUserReservations(
  userId: string
): Promise<ReservationWithDetails[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("reservations")
    .select(
      "*, spots!reservations_spot_id_fkey(label), profiles!reservations_user_id_fkey(full_name)"
    )
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .gte("date", today)
    .order("date");

  if (error)
    throw new Error(`Error fetching user reservations: ${error.message}`);

  return data.map((r) => {
    const spot = r.spots as unknown as { label: string } | null;
    const profile = r.profiles as unknown as { full_name: string } | null;

    return {
      ...r,
      spots: undefined,
      profiles: undefined,
      spot_label: spot?.label ?? "",
      user_name: profile?.full_name ?? "",
    } as ReservationWithDetails;
  });
}

/**
 * Check if a user already has a confirmed reservation on a given date.
 * Returns the reservation if found, null otherwise.
 */
export async function getUserReservationForDate(
  userId: string,
  date: string
): Promise<Reservation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .eq("status", "confirmed")
    .maybeSingle();

  if (error) throw new Error(`Error checking reservation: ${error.message}`);

  return data;
}
