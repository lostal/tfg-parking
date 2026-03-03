"use server";

/**
 * Acciones de cesión
 *
 * Server Actions para que los directivos cedan sus plazas asignadas
 * en fechas específicas.
 */

import { actionClient, success, error, type ActionResult } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createCessionSchema, cancelCessionSchema } from "@/lib/validations";
import { getAllResourceConfigs } from "@/lib/config";
import {
  getUserCessions as queryUserCessions,
  type CessionWithDetails,
} from "@/lib/queries/cessions";

/**
 * Crea cesiones para múltiples fechas.
 *
 * Reglas de negocio:
 * - El usuario debe tener una plaza de parking asignada (assigned_to = user.id, resource_type = 'parking')
 * - El usuario debe ser propietario de la plaza (assigned_to = user.id)
 * - Una cesión por plaza por fecha
 */
export const createCession = actionClient
  .schema(createCessionSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");

    // Comprobar si las cesiones de parking están habilitadas
    const config = await getAllResourceConfigs("parking");
    if (!config.cession_enabled) {
      throw new Error("Las cesiones de parking están deshabilitadas");
    }

    // Comprobar antelación mínima en la primera fecha seleccionada
    if (config.cession_min_advance_hours > 0 && parsedInput.dates.length > 0) {
      const firstDate = parsedInput.dates[0]!;
      const now = new Date();
      const targetDate = new Date(firstDate + "T00:00:00");
      const hoursAhead =
        (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursAhead < config.cession_min_advance_hours) {
        throw new Error(
          `La cesión debe realizarse con al menos ${config.cession_min_advance_hours} horas de antelación`
        );
      }
    }

    const supabase = await createClient();

    // Verify user owns the spot
    const { data: spot, error: spotError } = await supabase
      .from("spots")
      .select("id, assigned_to")
      .eq("id", parsedInput.spot_id)
      .maybeSingle();

    if (spotError)
      throw new Error(`Error al verificar plaza: ${spotError.message}`);
    if (!spot) throw new Error("Plaza no encontrada");
    if (spot.assigned_to !== user.id) {
      throw new Error("Solo puedes ceder tu propia plaza");
    }

    // Insert one cession per date
    const rows = parsedInput.dates.map((date) => ({
      spot_id: parsedInput.spot_id,
      user_id: user.id,
      date,
    }));

    const { data, error } = await supabase
      .from("cessions")
      .insert(rows)
      .select("id");

    if (error) {
      if (error.code === "23505") {
        throw new Error(
          "Ya existe una cesión para esta plaza en uno de los días seleccionados"
        );
      }
      console.error("[parking] createCession DB error:", {
        userId: user.id,
        spotId: parsedInput.spot_id,
        dates: parsedInput.dates,
        error: error.message,
      });
      throw new Error(`Error al crear cesión: ${error.message}`);
    }

    return { count: data.length };
  });

/**
 * Cancela una cesión.
 *
 * Reglas de negocio:
 * - El usuario debe ser el propietario de la cesión
 * - No se puede cancelar si la cesión ya ha sido reservada
 */
export const cancelCession = actionClient
  .schema(cancelCessionSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");

    const supabase = await createClient();

    // Fetch the cession to check status
    const { data: cession, error: fetchError } = await supabase
      .from("cessions")
      .select("id, status, user_id, spot_id, date")
      .eq("id", parsedInput.id)
      .single();

    if (fetchError || !cession) {
      throw new Error("Cesión no encontrada");
    }

    if (cession.user_id !== user.id && user.profile?.role !== "admin") {
      throw new Error("No puedes cancelar esta cesión");
    }

    // Buscar si hay una reserva activa sobre esta plaza+fecha.
    // IMPORTANTE: comprobamos la reserva real en BD, NO nos fiamos del campo
    // cession.status, que puede quedar dessincronizado si la actualización a
    // "reserved" falló silenciosamente en createReservation. Usar solo
    // activeReservation como fuente de verdad evita que un directivo pueda
    // cancelar una cesión que ya tiene un empleado reservado.
    const { data: activeReservation } = await supabase
      .from("reservations")
      .select("id")
      .eq("spot_id", cession.spot_id)
      .eq("date", cession.date)
      .eq("status", "confirmed")
      .maybeSingle();

    if (activeReservation && user.profile?.role !== "admin") {
      throw new Error(
        "No se puede cancelar: alguien ya ha reservado esta plaza"
      );
    }

    // Cancelar la reserva activa del empleado PRIMERO: si falla, la cesión
    // permanece intacta y no hay estado inconsistente.
    // El directivo tiene permiso RLS (policy reservations_cancel_by_spot_owner)
    // para cancelar reservas sobre su propia plaza asignada.
    if (activeReservation) {
      const { error: reservationError } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", activeReservation.id);

      if (reservationError) {
        // La cesión NO se ha modificado → no hay estado inconsistente.
        throw new Error(
          `No se pudo anular la reserva del empleado: ${reservationError.message}. La cesión no ha sido modificada.`
        );
      }
    }

    // Cancelar la cesión con el cliente normal: el directivo es el propietario
    // (user_id = auth.uid()) → la política RLS cessions_update_own lo permite.
    // El adminClient no es necesario aquí y falla si SUPABASE_SERVICE_ROLE_KEY
    // no está configurada.
    const { error: cancelError } = await supabase
      .from("cessions")
      .update({ status: "cancelled" })
      .eq("id", parsedInput.id);

    if (cancelError) {
      console.error("[parking] cancelCession DB error:", {
        userId: user.id,
        cessionId: parsedInput.id,
        error: cancelError.message,
      });
      throw new Error(`Error al cancelar cesión: ${cancelError.message}`);
    }

    return { cancelled: true, reservationAlsoCancelled: !!activeReservation };
  });

/**
 * Obtiene las cesiones activas del usuario actual.
 * Wrapper de acción para que los componentes cliente puedan llamarla.
 */
export async function getMyCessions(): Promise<
  ActionResult<CessionWithDetails[]>
> {
  try {
    const user = await getCurrentUser();
    if (!user) return error("No autenticado");

    const cessions = await queryUserCessions(user.id, "parking");
    return success(cessions);
  } catch (err) {
    console.error("getMyCessions error:", err);
    return error(
      err instanceof Error ? err.message : "Error al obtener cesiones"
    );
  }
}
