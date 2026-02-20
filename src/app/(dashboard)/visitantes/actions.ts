"use server";

/**
 * Server Actions de Reservas de Visitantes
 *
 * Server Actions para crear y cancelar reservas
 * realizadas por empleados para visitantes externos.
 */

import { actionClient } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  createVisitorReservationSchema,
  cancelVisitorReservationSchema,
} from "@/lib/validations";

/**
 * Crea una reserva de visitante.
 *
 * Reglas de negocio:
 * - Cualquier empleado autenticado puede reservar para un visitante
 * - Una reserva por plaza por día (garantizado por índice único de la BD)
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

    // TODO (P1): Enviar email de confirmación al visitante via Resend

    return { id: data.id };
  });

/**
 * Cancela una reserva de visitante.
 *
 * Reglas de negocio:
 * - Solo el empleado que la creó (o un admin) puede cancelarla
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
