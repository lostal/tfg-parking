"use server";

/**
 * Acciones de cesión de puestos de oficina
 *
 * Server Actions para que los usuarios con puesto preferente asignado
 * (management) puedan cederlo al pool general en fechas específicas.
 */

import { actionClient } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createCessionSchema, cancelCessionSchema } from "@/lib/validations";
import { getAllResourceConfigs } from "@/lib/config";

/**
 * Crea cesiones de puesto de oficina para múltiples fechas.
 *
 * El usuario debe tener un puesto de tipo 'assigned' con resource_type='office'
 * asignado para poder ceder.
 */
export const createOfficeCession = actionClient
  .schema(createCessionSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");

    // Comprobar si las cesiones de oficina están habilitadas
    const config = await getAllResourceConfigs("office");
    if (!config.cession_enabled) {
      throw new Error("Las cesiones de oficina están deshabilitadas");
    }

    const supabase = await createClient();

    // Verificar que el usuario es dueño del puesto y que es de oficina
    const { data: spot, error: spotError } = await supabase
      .from("spots")
      .select("id, assigned_to, resource_type")
      .eq("id", parsedInput.spot_id)
      .maybeSingle();

    if (spotError)
      throw new Error(`Error al verificar puesto: ${spotError.message}`);
    if (!spot) throw new Error("Puesto no encontrado");
    if (spot.resource_type !== "office") {
      throw new Error("Este puesto no es un espacio de oficina");
    }
    if (spot.assigned_to !== user.id) {
      throw new Error("Solo puedes ceder tu propio puesto");
    }

    // Check advance hours if configured
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
          "Ya existe una cesión para este puesto en uno de los días seleccionados"
        );
      }
      throw new Error(`Error al crear cesión: ${error.message}`);
    }

    return { count: data.length };
  });

/**
 * Cancela una cesión de puesto de oficina.
 */
export const cancelOfficeCession = actionClient
  .schema(cancelCessionSchema)
  .action(async ({ parsedInput }) => {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");

    const supabase = await createClient();

    const { data: cession, error: fetchError } = await supabase
      .from("cessions")
      .select("id, status, user_id, spot_id, date")
      .eq("id", parsedInput.id)
      .single();

    if (fetchError || !cession) throw new Error("Cesión no encontrada");

    if (cession.user_id !== user.id && user.profile?.role !== "admin") {
      throw new Error("No puedes cancelar esta cesión");
    }

    // Verificar si hay una reserva activa sobre esta plaza+fecha
    const { data: activeReservation } = await supabase
      .from("reservations")
      .select("id")
      .eq("spot_id", cession.spot_id)
      .eq("date", cession.date)
      .eq("status", "confirmed")
      .maybeSingle();

    if (activeReservation && user.profile?.role !== "admin") {
      throw new Error(
        "No puedes cancelar una cesión que ya ha sido reservada. Contacta con un administrador."
      );
    }

    // Si admin cancela con reserva activa, cancela también la reserva
    if (activeReservation && user.profile?.role === "admin") {
      await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", activeReservation.id);
    }

    const { error: updateError } = await supabase
      .from("cessions")
      .update({ status: "cancelled" })
      .eq("id", parsedInput.id);

    if (updateError) {
      throw new Error(`Error al cancelar cesión: ${updateError.message}`);
    }

    return { cancelled: true };
  });
