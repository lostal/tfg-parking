/**
 * Booking Date Validation
 *
 * Lógica compartida de validación de fecha de reserva, usada tanto por
 * parking como por oficinas para evitar duplicación.
 */

import { getDayOfWeek } from "@/lib/utils";
import type { ResourceConfigValues } from "@/lib/config";

/**
 * Valida que la fecha sea reservable según la configuración del recurso.
 * Lanza un Error con mensaje en español si no cumple alguna regla.
 *
 * Reglas comprobadas:
 *  1. La fecha no puede ser en el pasado.
 *  2. El día de la semana debe estar en `config.allowed_days`.
 *  3. La antelación no puede superar `config.max_advance_days`.
 */
export function validateBookingDate(
  date: string,
  config: Pick<ResourceConfigValues, "allowed_days" | "max_advance_days">
): void {
  const dayOfWeek = getDayOfWeek(date);
  if (!config.allowed_days.includes(dayOfWeek)) {
    throw new Error("No se puede reservar en este día de la semana");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reservationDate = new Date(date);
  const daysAhead = Math.round(
    (reservationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysAhead < 0) {
    throw new Error("No puedes reservar para fechas pasadas");
  }
  if (config.max_advance_days !== null && daysAhead > config.max_advance_days) {
    throw new Error(
      `Solo puedes reservar con un máximo de ${config.max_advance_days} días de antelación`
    );
  }
}
