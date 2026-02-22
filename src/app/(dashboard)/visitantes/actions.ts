"use server";

/**
 * Server Actions de Reservas de Visitantes
 *
 * Server Actions para crear y cancelar reservas realizadas
 * por empleados para visitantes externos, con envío de email
 * de confirmación y archivo .ics para añadir al calendario.
 */

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { actionClient, type ActionResult, success, error } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import {
  createVisitorReservationSchema,
  cancelVisitorReservationSchema,
} from "@/lib/validations";
import { sendVisitorReservationEmail } from "@/lib/email";
import {
  generateICSBuffer,
  generateGoogleCalendarUrl,
  generateOutlookUrl,
} from "@/lib/calendar";
import {
  getUpcomingVisitorReservations,
  getAvailableVisitorSpotsForDate,
  type VisitorReservationWithDetails,
} from "@/lib/queries/visitor-reservations";

// ─── Funciones de consulta ────────────────────────────────────

/**
 * Obtiene las reservas de visitantes próximas confirmadas.
 */
export async function getVisitorReservationsAction(): Promise<
  ActionResult<VisitorReservationWithDetails[]>
> {
  try {
    const user = await getCurrentUser();
    if (!user) return error("No autenticado");

    const reservations = await getUpcomingVisitorReservations();
    return success(reservations);
  } catch (err) {
    console.error("Error al obtener reservas de visitantes:", err);
    return error(
      err instanceof Error ? err.message : "Error al obtener las reservas"
    );
  }
}

/**
 * Obtiene las plazas de visitantes disponibles para una fecha dada.
 */
export async function getAvailableVisitorSpotsAction(
  date: string
): Promise<ActionResult<{ id: string; label: string }[]>> {
  try {
    const user = await getCurrentUser();
    if (!user) return error("No autenticado");

    const spots = await getAvailableVisitorSpotsForDate(date);
    return success(spots);
  } catch (err) {
    console.error("Error al obtener plazas de visitantes:", err);
    return error(
      err instanceof Error ? err.message : "Error al obtener plazas disponibles"
    );
  }
}

// ─── Mutations ────────────────────────────────────────────────

/**
 * Crea una reserva de visitante y envía el email de confirmación
 * con el archivo .ics adjunto para añadir al calendario.
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

    const { data: spotData } = await supabase
      .from("spots")
      .select("label")
      .eq("id", parsedInput.spot_id)
      .single();

    const spotLabel = spotData?.label ?? parsedInput.spot_id;
    const reservedByName = user.profile?.full_name ?? user.email;

    // Insertar reserva en la BD
    const { data, error: insertError } = await supabase
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

    if (insertError) {
      if (insertError.code === "23505") {
        throw new Error(
          "Esta plaza ya tiene una reserva de visitante para este día"
        );
      }
      throw new Error(
        `Error al crear reserva de visitante: ${insertError.message}`
      );
    }

    const reservationId = data.id;
    const formattedDate = format(
      new Date(parsedInput.date + "T00:00:00"),
      "EEEE, d 'de' MMMM 'de' yyyy",
      { locale: es }
    );

    const calendarData = {
      reservationId,
      spotLabel,
      date: parsedInput.date,
      visitorName: parsedInput.visitor_name,
      visitorCompany: parsedInput.visitor_company,
      reservedByName,
      notes: parsedInput.notes,
    };

    // Enviar email con .ics adjunto de forma no bloqueante.
    // Si falla el email, la reserva ya está creada igualmente.
    try {
      const [icsBuffer, googleCalendarUrl, outlookUrl] = await Promise.all([
        Promise.resolve(generateICSBuffer(calendarData)),
        Promise.resolve(generateGoogleCalendarUrl(calendarData)),
        Promise.resolve(generateOutlookUrl(calendarData)),
      ]);

      await sendVisitorReservationEmail({
        to: parsedInput.visitor_email,
        visitorName: parsedInput.visitor_name,
        visitorCompany: parsedInput.visitor_company,
        spotLabel,
        date: formattedDate,
        reservedByName,
        notes: parsedInput.notes,
        googleCalendarUrl,
        outlookUrl,
        icsBuffer,
      });

      // Marcar notificación como enviada
      await supabase
        .from("visitor_reservations")
        .update({ notification_sent: true })
        .eq("id", reservationId);
    } catch (emailErr) {
      console.error(
        "Error al enviar email al visitante (la reserva se creó correctamente):",
        emailErr
      );
    }

    revalidatePath("/visitantes");
    return { id: reservationId };
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

    const { error: updateError } = await supabase
      .from("visitor_reservations")
      .update({ status: "cancelled" })
      .eq("id", parsedInput.id)
      .eq("reserved_by", user.id);

    if (updateError) {
      throw new Error(
        `Error al cancelar reserva de visitante: ${updateError.message}`
      );
    }

    revalidatePath("/visitantes");
    return { cancelled: true };
  });
