"use server";

/**
 * Calendar Data Actions
 *
 * Server Actions que alimentan la vista unificada de calendario de parking.
 * Devuelven el estado de cada día del mes para pintarlo con colores según rol.
 */

import { actionClient, success, error, type ActionResult } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { z } from "zod/v4";
import { parseISO } from "date-fns";

// ─── Types ───────────────────────────────────────────────────

/** Estado de un día del calendario para un empleado */
export type EmployeeDayStatus =
  | "plenty" // Verde: hay plazas disponibles
  | "few" // Amarillo: quedan pocas (≤3)
  | "none" // Rojo: sin plazas
  | "reserved" // Azul: el usuario ya tiene reserva ese día
  | "past" // Pasado / no aplica
  | "weekend"; // Fin de semana

/** Estado de un día del calendario para un directivo */
export type ManagementDayStatus =
  | "can-cede" // Verde: puede ceder (no hay cesión)
  | "ceded-free" // Naranja: cedida y sin reservar aún
  | "ceded-taken" // Azul: cedida y ya reservada por alguien
  | "in-use" // Gris: plaza en uso (no cedida, día laboral futuro)
  | "past"
  | "weekend";

export interface CalendarDayData {
  date: string; // "yyyy-MM-dd"
  employeeStatus?: EmployeeDayStatus;
  managementStatus?: ManagementDayStatus;
  /** Plazas disponibles ese día (para empleado) */
  availableCount?: number;
  /** ID de reserva del usuario ese día (para empleado) */
  myReservationId?: string;
  /** ID de cesión del directivo ese día */
  myCessionId?: string;
  /** Estado de la cesión si existe */
  cessionStatus?: string;
}

// ─── Helpers ─────────────────────────────────────────────────

function isWeekend(dateStr: string): boolean {
  const d = parseISO(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function isPast(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0] as string;
  return dateStr < today;
}

// ─── Main Action ─────────────────────────────────────────────

const getCalendarDataSchema = z.object({
  /** Primer día del mes visible → "yyyy-MM-dd" */
  monthStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * Obtiene el estado de todos los días del mes para el usuario actual.
 * La respuesta incluye tanto employeeStatus como managementStatus
 * según el rol del usuario.
 */
export const getCalendarMonthData = actionClient
  .schema(getCalendarDataSchema)
  .action(async ({ parsedInput }): Promise<CalendarDayData[]> => {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");

    const role = user.profile?.role ?? "employee";
    const monthStart = parseISO(parsedInput.monthStart);
    const supabase = await createClient();

    // Rango de fechas del mes
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().split("T")[0];
    const lastDay = new Date(year, month + 1, 0).toISOString().split("T")[0];

    if (role === "management" || role === "admin") {
      // ── Directivo: necesita su plaza asignada y sus cesiones ──
      const [spotResult, cessionsResult] = await Promise.all([
        supabase
          .from("spots")
          .select("id, label")
          .eq("assigned_to", user.id)
          .maybeSingle(),
        supabase
          .from("cessions")
          .select("id, date, status")
          .eq("user_id", user.id)
          .gte("date", firstDay)
          .lte("date", lastDay)
          .neq("status", "cancelled"),
      ]);

      const spotId = spotResult.data?.id ?? null;
      const cessionsByDate = new Map(
        (cessionsResult.data ?? []).map((c) => [c.date, c])
      );

      const days: CalendarDayData[] = [];

      // Iteramos todos los días del mes
      const current = new Date(year, month, 1);
      while (current.getMonth() === month) {
        const dateStr = current.toISOString().split("T")[0] as string;
        const cession = cessionsByDate.get(dateStr);

        let status: ManagementDayStatus;

        if (isWeekend(dateStr)) {
          status = "weekend";
        } else if (isPast(dateStr)) {
          status = "past";
        } else if (!spotId) {
          status = "in-use"; // Sin plaza asignada
        } else if (!cession) {
          status = "can-cede";
        } else if (cession.status === "available") {
          status = "ceded-free";
        } else if (cession.status === "reserved") {
          status = "ceded-taken";
        } else {
          status = "in-use";
        }

        days.push({
          date: dateStr,
          managementStatus: status,
          myCessionId: cession?.id,
          cessionStatus: cession?.status,
        });

        current.setDate(current.getDate() + 1);
      }

      return days;
    } else {
      // ── Empleado: necesita plazas disponibles + sus propias reservas ──
      const [spotsData, reservationsData, cessionsData, myReservationsData] =
        await Promise.all([
          supabase.from("spots").select("id, type").eq("is_active", true),
          supabase
            .from("reservations")
            .select("spot_id, date")
            .gte("date", firstDay)
            .lte("date", lastDay)
            .eq("status", "confirmed"),
          supabase
            .from("cessions")
            .select("spot_id, date, status")
            .gte("date", firstDay)
            .lte("date", lastDay)
            .neq("status", "cancelled"),
          supabase
            .from("reservations")
            .select("id, date")
            .eq("user_id", user.id)
            .gte("date", firstDay)
            .lte("date", lastDay)
            .eq("status", "confirmed"),
        ]);

      const allSpots = spotsData.data ?? [];
      const totalOriginalSpots = allSpots.filter(
        (s) => s.type === "standard" || s.type === "disabled"
      ).length;

      // Agrupa reservas por fecha
      const reservedByDate = new Map<string, Set<string>>();
      for (const r of reservationsData.data ?? []) {
        if (!reservedByDate.has(r.date)) reservedByDate.set(r.date, new Set());
        reservedByDate.get(r.date)!.add(r.spot_id);
      }

      // Agrupa cesiones activas por fecha → estas añaden disponibilidad
      const cededAvailableByDate = new Map<string, number>();
      for (const c of cessionsData.data ?? []) {
        if (c.status === "available") {
          cededAvailableByDate.set(
            c.date,
            (cededAvailableByDate.get(c.date) ?? 0) + 1
          );
        }
      }

      // Mis reservas
      const myReservationByDate = new Map<string, { id: string }>();
      for (const r of myReservationsData.data ?? []) {
        myReservationByDate.set(r.date, { id: r.id });
      }

      const days: CalendarDayData[] = [];
      const current = new Date(year, month, 1);

      while (current.getMonth() === month) {
        const dateStr = current.toISOString().split("T")[0] as string;
        const myRes = myReservationByDate.get(dateStr);
        const reserved = reservedByDate.get(dateStr) ?? new Set();
        const cededAvail = cededAvailableByDate.get(dateStr) ?? 0;

        // Plazas estándar disponibles ese día
        const standardAvailable =
          totalOriginalSpots -
          [...reserved].filter((id) => {
            const spot = allSpots.find((s) => s.id === id);
            return spot?.type === "standard" || spot?.type === "disabled";
          }).length;

        const totalAvailable = standardAvailable + cededAvail;

        let status: EmployeeDayStatus;

        if (isWeekend(dateStr)) {
          status = "weekend";
        } else if (isPast(dateStr)) {
          status = "past";
        } else if (myRes) {
          status = "reserved";
        } else if (totalAvailable <= 0) {
          status = "none";
        } else if (totalAvailable <= 3) {
          status = "few";
        } else {
          status = "plenty";
        }

        days.push({
          date: dateStr,
          employeeStatus: status,
          availableCount: totalAvailable > 0 ? totalAvailable : 0,
          myReservationId: myRes?.id,
        });

        current.setDate(current.getDate() + 1);
      }

      return days;
    }
  });

/**
 * Acción simplificada para obtener los datos del mes actual
 * sin necesidad de construir el input manualmente.
 */
export async function getCalendarMonthDataSimple(
  monthStart: string
): Promise<ActionResult<CalendarDayData[]>> {
  try {
    const result = await getCalendarMonthData({ monthStart });
    if (!result) {
      return error("Error al obtener datos del calendario");
    }
    if (!result.success) {
      return error(result.error);
    }
    return success(result.data);
  } catch (err) {
    return error(
      err instanceof Error
        ? err.message
        : "Error al obtener datos del calendario"
    );
  }
}
