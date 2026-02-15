"use server";

/**
 * Parking Reservation Actions
 *
 * Server Actions for creating and cancelling employee parking reservations.
 */

import { actionClient } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  createReservationSchema,
  cancelReservationSchema,
} from "@/lib/validations";

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
