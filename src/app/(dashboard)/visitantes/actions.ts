"use server";

/**
 * Visitor Reservation Actions
 *
 * Server Actions for creating and cancelling reservations
 * made by employees for external visitors.
 */

import { actionClient } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  createVisitorReservationSchema,
  cancelVisitorReservationSchema,
} from "@/lib/validations";

/**
 * Create a visitor reservation.
 *
 * Business rules:
 * - Any authenticated employee can reserve for a visitor
 * - One reservation per spot per day (enforced by DB unique index)
 */
export const createVisitorReservation = actionClient
  .schema(createVisitorReservationSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("visitor_reservations")
      .insert({
        spot_id: parsedInput.spot_id,
        reserved_by: user.id,
        date: parsedInput.date,
        visitor_name: parsedInput.visitor_name,
        visitor_company: parsedInput.visitor_company,
        visitor_email: parsedInput.visitor_email,
        notes: parsedInput.notes ?? null,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error(
          "Esta plaza ya tiene una reserva de visitante para este día"
        );
      }
      throw new Error(`Error al crear reserva de visitante: ${error.message}`);
    }

    // TODO (P1): Send notification email to visitor via Resend

    return { id: data.id };
  });

/**
 * Cancel a visitor reservation.
 *
 * Business rules:
 * - Only the employee who made it (or admin) can cancel
 */
export const cancelVisitorReservation = actionClient
  .schema(cancelVisitorReservationSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");

    const supabase = await createClient();

    const { error } = await supabase
      .from("visitor_reservations")
      .update({ status: "cancelled" })
      .eq("id", parsedInput.id)
      .eq("reserved_by", user.id);

    if (error) {
      throw new Error(
        `Error al cancelar reserva de visitante: ${error.message}`
      );
    }

    return { cancelled: true };
  });
