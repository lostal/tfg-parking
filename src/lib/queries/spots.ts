/**
 * Spot Queries
 *
 * Server-side functions for reading parking spot data.
 * Used by Server Components — do NOT use in client components.
 */

import { createClient } from "@/lib/supabase/server";
import type { Spot } from "@/lib/supabase/types";
import type { SpotWithStatus, SpotStatus } from "@/types";

/**
 * Get all active spots (no date-specific status).
 * Used by admin panel for CRUD management.
 */
export async function getSpots(): Promise<Spot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .eq("is_active", true)
    .order("label");

  if (error) throw new Error(`Error fetching spots: ${error.message}`);
  return data;
}

/**
 * Get all active spots with computed status for a specific date.
 *
 * Status logic:
 * - management spot without cession on that date → "occupied" (assigned)
 * - management spot with cession (available) → "ceded" (free to book)
 * - management spot with cession (reserved) → "reserved"
 * - standard spot with confirmed reservation → "reserved"
 * - spot with confirmed visitor reservation → "visitor-blocked"
 * - otherwise → "free"
 */
export async function getSpotsByDate(date: string): Promise<SpotWithStatus[]> {
  const supabase = await createClient();

  // Fetch all data in parallel
  const [spotsResult, reservationsResult, cessionsResult, visitorResult] =
    await Promise.all([
      supabase.from("spots").select("*").eq("is_active", true).order("label"),
      supabase
        .from("reservations")
        .select(
          "id, spot_id, user_id, profiles!reservations_user_id_fkey(full_name)"
        )
        .eq("date", date)
        .eq("status", "confirmed"),
      supabase
        .from("cessions")
        .select("id, spot_id, status")
        .eq("date", date)
        .neq("status", "cancelled"),
      supabase
        .from("visitor_reservations")
        .select("id, spot_id, visitor_name")
        .eq("date", date)
        .eq("status", "confirmed"),
    ]);

  if (spotsResult.error)
    throw new Error(`Error fetching spots: ${spotsResult.error.message}`);

  const spots = spotsResult.data;
  const reservations = reservationsResult.data ?? [];
  const cessions = cessionsResult.data ?? [];
  const visitorReservations = visitorResult.data ?? [];

  // Build lookup maps
  const reservationBySpot = new Map(reservations.map((r) => [r.spot_id, r]));
  const cessionBySpot = new Map(cessions.map((c) => [c.spot_id, c]));
  const visitorBySpot = new Map(visitorReservations.map((v) => [v.spot_id, v]));

  return spots.map((spot): SpotWithStatus => {
    let status: SpotStatus = "free";
    let reservation_id: string | undefined;
    let reserved_by_name: string | undefined;

    const reservation = reservationBySpot.get(spot.id);
    const cession = cessionBySpot.get(spot.id);
    const visitor = visitorBySpot.get(spot.id);

    if (visitor) {
      // Visitor reservation takes precedence
      status = "visitor-blocked";
      reservation_id = visitor.id;
      reserved_by_name = visitor.visitor_name;
    } else if (reservation) {
      status = "reserved";
      reservation_id = reservation.id;
      // Profile join returns an object (single relation via !fkey)
      const profile = reservation.profiles as unknown as {
        full_name: string;
      } | null;
      reserved_by_name = profile?.full_name ?? undefined;
    } else if (spot.type === "management") {
      if (cession) {
        // Management spot has been ceded
        status = cession.status === "reserved" ? "reserved" : "ceded";
        reservation_id = cession.id;
      } else {
        // Management spot not ceded → occupied by assignee
        status = "occupied";
      }
    }

    return {
      id: spot.id,
      label: spot.label,
      type: spot.type,
      assigned_to: spot.assigned_to,
      position_x: spot.position_x,
      position_y: spot.position_y,
      status,
      reservation_id,
      reserved_by_name,
    };
  });
}
