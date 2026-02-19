"use server";

/**
 * Cession Actions
 *
 * Server Actions for management users to cede their assigned
 * parking spots on specific dates.
 */

import { actionClient, success, error, type ActionResult } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createCessionSchema, cancelCessionSchema } from "@/lib/validations";
import {
  getUserCessions as queryUserCessions,
  type CessionWithDetails,
} from "@/lib/queries/cessions";

/**
 * Create cessions for multiple dates.
 *
 * Business rules:
 * - User must be management or admin
 * - User must own the spot (assigned_to = user.id)
 * - One cession per spot per date
 */
export const createCession = actionClient
  .schema(createCessionSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");

    if (
      !user.profile?.role ||
      !["management", "admin"].includes(user.profile.role)
    ) {
      throw new Error("Solo directivos pueden ceder plazas");
    }

    const supabase = await createClient();

    // Verify user owns the spot
    const { data: spot } = await supabase
      .from("spots")
      .select("id, assigned_to")
      .eq("id", parsedInput.spot_id)
      .single();

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
      throw new Error(`Error al crear cesión: ${error.message}`);
    }

    return { count: data.length };
  });

/**
 * Cancel a cession.
 *
 * Business rules:
 * - User must own the cession
 * - Cannot cancel if the cession has already been reserved
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

    // Buscar si hay una reserva activa sobre esta plaza+fecha (puede existir
    // si el admin cancela una cesión ya reservada, o en edge cases de RLS).
    const { data: activeReservation } = await supabase
      .from("reservations")
      .select("id")
      .eq("spot_id", cession.spot_id)
      .eq("date", cession.date)
      .eq("status", "confirmed")
      .maybeSingle();

    if (
      cession.status === "reserved" &&
      activeReservation &&
      user.profile?.role !== "admin"
    ) {
      throw new Error(
        "No se puede cancelar: alguien ya ha reservado esta plaza"
      );
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
      throw new Error(`Error al cancelar cesión: ${cancelError.message}`);
    }

    // Si había una reserva activa del empleado, cancelarla también.
    // El directivo tiene permiso RLS (policy reservations_cancel_by_spot_owner)
    // para cancelar reservas sobre su propia plaza asignada.
    if (activeReservation) {
      const { error: reservationError } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", activeReservation.id);

      if (reservationError) {
        // La cesión ya quedó cancelada, pero la reserva del empleado no.
        // Lanzar error para que el usuario sepa que debe revisar manualmente.
        throw new Error(
          `Cesión cancelada, pero no se pudo anular la reserva del empleado: ${reservationError.message}`
        );
      }
    }

    return { cancelled: true, reservationAlsoCancelled: !!activeReservation };
  });

/**
 * Get the current user's active cessions.
 * Wrapper action for client components to call.
 */
export async function getMyCessions(): Promise<
  ActionResult<CessionWithDetails[]>
> {
  try {
    const user = await getCurrentUser();
    if (!user) return error("No autenticado");

    const cessions = await queryUserCessions(user.id);
    return success(cessions);
  } catch (err) {
    console.error("getMyCessions error:", err);
    return error(
      err instanceof Error ? err.message : "Error al obtener cesiones"
    );
  }
}
