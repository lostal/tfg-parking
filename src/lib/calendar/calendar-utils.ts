/**
 * Utilidades compartidas de calendario
 *
 * Lógica reutilizada por parking/calendar-actions.ts y oficinas/calendar-actions.ts.
 * Centraliza el cálculo de rangos de mes, el umbral "few" y la lógica de estado
 * de cesión por día.
 */

import type { ResourceCessionDayStatus } from "./resource-types";
import { toServerDateStr, isPast, getDayOfWeek } from "@/lib/utils";

// ─── Constantes ───────────────────────────────────────────────

/** Umbral de plazas para estado "few" (pocas plazas disponibles). */
export const FEW_SPOTS_THRESHOLD = 3;

// ─── Rango de mes ─────────────────────────────────────────────

export interface MonthRange {
  year: number;
  month: number;
  firstDay: string;
  lastDay: string;
}

/**
 * Calcula el primer y último día del mes a partir de una fecha en el mes.
 * @param monthStart - Primer día del mes como objeto Date
 */
export function buildMonthRange(monthStart: Date): MonthRange {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const mm = String(month + 1).padStart(2, "0");
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return {
    year,
    month,
    firstDay: `${year}-${mm}-01`,
    lastDay: `${year}-${mm}-${String(daysInMonth).padStart(2, "0")}`,
  };
}

// ─── Estado de cesión por día ─────────────────────────────────

interface CessionDayParams {
  dateStr: string;
  allowedDays: number[];
  cession?: { status: string } | undefined;
}

/**
 * Determina el estado de un día en la vista de cesión (usuario con plaza asignada).
 * Lógica pura, sin side-effects, fácil de testear.
 */
export function computeCessionDayStatus(
  params: CessionDayParams
): ResourceCessionDayStatus {
  const { dateStr, allowedDays, cession } = params;

  if (!allowedDays.includes(getDayOfWeek(dateStr))) return "unavailable";
  if (isPast(dateStr)) return "past";
  if (!cession) return "can-cede";
  if (cession.status === "available") return "ceded-free";
  if (cession.status === "reserved") return "ceded-taken";
  return "in-use";
}

// ─── Iteración de días del mes ────────────────────────────────

/**
 * Genera la secuencia de fechas "yyyy-MM-dd" para todos los días de un mes.
 * @param year - El año
 * @param month - El mes (0-based, como Date.getMonth())
 */
export function* iterMonthDays(year: number, month: number): Generator<string> {
  const current = new Date(year, month, 1);
  while (current.getMonth() === month) {
    yield toServerDateStr(current);
    current.setDate(current.getDate() + 1);
  }
}
