"use server";

/**
 * Parking Reservation Actions
 *
 * Server Actions for creating and cancelling employee parking reservations,
 * plus query helpers for the parking list view.
 */

import { actionClient, type ActionResult, success, error } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  createReservationSchema,
  cancelReservationSchema,
} from "@/lib/validations";
import type { SpotWithStatus } from "@/types";
import type { ReservationWithDetails } from "@/lib/queries/reservations";

// ─── Query Functions ─────────────────────────────────────────

/**
 * Get available spots for a given date.
 *
 * A spot is "available" if:
 * - It has no confirmed reservation for that date
 * - If type='management', a cession with status='available' must exist
 * - It is active
 *
 * Returns spots that the current user can book.
 */
export async function getAvailableSpotsForDate(
  date: string
): Promise<ActionResult<SpotWithStatus[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) return error("No autenticado");

    const supabase = await createClient();

    // Fetch all data in parallel
    const [spotsResult, reservationsResult, cessionsResult, visitorResult] =
      await Promise.all([
        supabase.from("spots").select("*").eq("is_active", true).order("label"),
        supabase
          .from("reservations")
          .select("id, spot_id")
          .eq("date", date)
          .eq("status", "confirmed"),
        supabase
          .from("cessions")
          .select("id, spot_id, status")
          .eq("date", date)
          .neq("status", "cancelled"),
        supabase
          .from("visitor_reservations")
          .select("id, spot_id")
          .eq("date", date)
          .eq("status", "confirmed"),
      ]);

    if (spotsResult.error)
      return error(`Error al obtener plazas: ${spotsResult.error.message}`);

    const spots = spotsResult.data;
    const reservedSpotIds = new Set(
      (reservationsResult.data ?? []).map((r) => r.spot_id)
    );
    const cessionBySpot = new Map(
      (cessionsResult.data ?? []).map((c) => [c.spot_id, c])
    );
    const visitorSpotIds = new Set(
      (visitorResult.data ?? []).map((v) => v.spot_id)
    );

    const available: SpotWithStatus[] = [];

    for (const spot of spots) {
      // Skip spots with confirmed reservations
      if (reservedSpotIds.has(spot.id)) continue;

      // Skip spots with visitor reservations
      if (visitorSpotIds.has(spot.id)) continue;

      if (spot.type === "management") {
        // Management spots: only available if there's an active cession
        const cession = cessionBySpot.get(spot.id);
        if (!cession || cession.status !== "available") continue;

        available.push({
          id: spot.id,
          label: spot.label,
          type: spot.type,
          assigned_to: spot.assigned_to,
          position_x: spot.position_x,
          position_y: spot.position_y,
          status: "ceded",
        });
      } else {
        available.push({
          id: spot.id,
          label: spot.label,
          type: spot.type,
          assigned_to: spot.assigned_to,
          position_x: spot.position_x,
          position_y: spot.position_y,
          status: "free",
        });
      }
    }

    return success(available);
  } catch (err) {
    console.error("getAvailableSpotsForDate error:", err);
    return error(
      err instanceof Error ? err.message : "Error al obtener plazas disponibles"
    );
  }
}

/**
 * Get the current user's upcoming confirmed reservations.
 * Returns reservations from today onwards, with spot details.
 */
export async function getMyReservations(): Promise<
  ActionResult<ReservationWithDetails[]>
> {
  try {
    const user = await getCurrentUser();
    if (!user) return error("No autenticado");

    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error: dbError } = await supabase
      .from("reservations")
      .select(
        "*, spots!reservations_spot_id_fkey(label), profiles!reservations_user_id_fkey(full_name)"
      )
      .eq("user_id", user.id)
      .eq("status", "confirmed")
      .gte("date", today)
      .order("date");

    if (dbError) return error(`Error al obtener reservas: ${dbError.message}`);

    const reservations: ReservationWithDetails[] = (data ?? []).map((r) => {
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

    return success(reservations);
  } catch (err) {
    console.error("getMyReservations error:", err);
    return error(
      err instanceof Error ? err.message : "Error al obtener tus reservas"
    );
  }
}

/**
 * Create a new parking reservation.
 *
 * Business rules:
 * - User must be authenticated
 * - One reservation per user per day (enforced by DB unique index)
 * - One reservation per spot per day (enforced by DB unique index)
 * - Spot must be free or ceded for that date
 */
export const createReservation = actionClient
  .schema(createReservationSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");

    const supabase = await createClient();

    // Check if user already has a reservation for this date
    const { data: existing } = await supabase
      .from("reservations")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", parsedInput.date)
      .eq("status", "confirmed")
      .maybeSingle();

    if (existing) {
      throw new Error("Ya tienes una reserva para este día");
    }

    // Insert reservation
    const { data, error } = await supabase
      .from("reservations")
      .insert({
        spot_id: parsedInput.spot_id,
        user_id: user.id,
        date: parsedInput.date,
        notes: parsedInput.notes ?? null,
      })
      .select("id")
      .single();

    if (error) {
      // Handle unique constraint violations
      if (error.code === "23505") {
        throw new Error("Esta plaza ya está reservada para este día");
      }
      throw new Error(`Error al crear reserva: ${error.message}`);
    }

    return { id: data.id };
  });

/**
 * Cancel an existing reservation.
 *
 * Business rules:
 * - User must own the reservation (or be admin — enforced by RLS)
 */
export const cancelReservation = actionClient
  .schema(cancelReservationSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");

    const supabase = await createClient();

    const { error } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", parsedInput.id)
      .eq("user_id", user.id);

    if (error) {
      throw new Error(`Error al cancelar reserva: ${error.message}`);
    }

    return { cancelled: true };
  });
