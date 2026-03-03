"use server";

/**
 * Calendar Data Actions
 *
 * Server Actions que alimentan la vista unificada de calendario de parking.
 * Devuelven el estado de cada día del mes para pintarlo con colores según rol.
 */

import { actionClient } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import type {
  ResourceDayData,
  ResourceDayStatus,
} from "@/lib/calendar/resource-types";
import {
  buildMonthRange,
  computeCessionDayStatus,
  iterMonthDays,
  FEW_SPOTS_THRESHOLD,
} from "@/lib/calendar/calendar-utils";
import { z } from "zod/v4";
import { parseISO } from "date-fns";
import { isPast, getDayOfWeek } from "@/lib/utils";
import { getAllResourceConfigs } from "@/lib/config";

// ─── Types ───────────────────────────────────────────────────

type MyReservationRow = {
  id: string;
  date: string;
  spot: { label: string } | null;
};

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
  .action(async ({ parsedInput }): Promise<ResourceDayData[]> => {
    const user = await getCurrentUser();
    if (!user) throw new Error("No autenticado");

    const config = await getAllResourceConfigs("parking");
    const allowedDays: number[] = config.allowed_days;

    const monthStart = parseISO(parsedInput.monthStart);
    const supabase = await createClient();
    const { year, month, firstDay, lastDay } = buildMonthRange(monthStart);

    // Comprobar si el usuario tiene plaza asignada de parking
    const { data: assignedSpot } = await supabase
      .from("spots")
      .select("id, label")
      .eq("assigned_to", user.id)
      .eq("resource_type", "parking")
      .maybeSingle();

    if (assignedSpot) {
      // ── Usuario con plaza asignada: gestiona cesiones ──
      // El trigger trg_sync_cession_status garantiza que cession.status
      // siempre es coherente con las reservas reales.
      const cessionsResult = await supabase
        .from("cessions")
        .select("id, date, status")
        .eq("user_id", user.id)
        .gte("date", firstDay)
        .lte("date", lastDay)
        .neq("status", "cancelled");

      const spotId: string = assignedSpot.id;
      void spotId; // confirma que spotId siempre existe dentro de este bloque
      const cessionsByDate = new Map(
        (cessionsResult.data ?? []).map((c) => [c.date, c])
      );

      return Array.from(iterMonthDays(year, month)).map((dateStr) => {
        const cession = cessionsByDate.get(dateStr);
        return {
          date: dateStr,
          cessionStatus_day: computeCessionDayStatus({
            dateStr,
            allowedDays,
            cession,
          }),
          myCessionId: cession?.id,
          cessionStatus: cession?.status,
        };
      });
    } else {
      // ── Usuario sin plaza asignada: reservar plazas disponibles ──
      const [spotsData, reservationsData, cessionsData, myReservationsData] =
        await Promise.all([
          supabase
            .from("spots")
            .select("id, type, assigned_to")
            .eq("is_active", true)
            .eq("resource_type", "parking"),
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
            .select("id, date, spot:spots(label)")
            .eq("user_id", user.id)
            .gte("date", firstDay)
            .lte("date", lastDay)
            .eq("status", "confirmed")
            .returns<MyReservationRow[]>(),
        ]);

      const allSpots = spotsData.data ?? [];

      // Plazas libremente reservables = type='standard' sin propietario.
      // Las plazas con assigned_to solo se reservan vía cesión de su dueño.
      // Las plazas type='visitor' nunca cuentan para empleados.
      const reservableSpots = allSpots.filter(
        (s) => s.type === "standard" && !s.assigned_to
      );
      const totalOriginalSpots = reservableSpots.length;
      const reservableIds = new Set(reservableSpots.map((s) => s.id));
      // Set de todos los IDs de parking (para filtrar cesiones cross-resource)
      const allParkingIds = new Set(allSpots.map((s) => s.id));

      // Agrupa reservas por fecha
      const reservedByDate = new Map<string, Set<string>>();
      for (const r of reservationsData.data ?? []) {
        if (!reservedByDate.has(r.date)) reservedByDate.set(r.date, new Set());
        reservedByDate.get(r.date)!.add(r.spot_id);
      }

      // Cesiones disponibles de plazas con dueño añaden disponibilidad.
      // Guard de resource_type: solo procesar cesiones cuyo spot_id sea de parking.
      const cededAvailableByDate = new Map<string, number>();
      for (const c of cessionsData.data ?? []) {
        if (allParkingIds.has(c.spot_id) && c.status === "available") {
          cededAvailableByDate.set(
            c.date,
            (cededAvailableByDate.get(c.date) ?? 0) + 1
          );
        }
      }

      // Mis reservas
      const myReservationByDate = new Map<
        string,
        { id: string; spotLabel?: string }
      >();
      for (const r of myReservationsData.data ?? []) {
        myReservationByDate.set(r.date, {
          id: r.id,
          spotLabel: r.spot?.label ?? undefined,
        });
      }

      return Array.from(iterMonthDays(year, month)).map((dateStr) => {
        const myRes = myReservationByDate.get(dateStr);
        const reserved = reservedByDate.get(dateStr) ?? new Set();
        const cededAvail = cededAvailableByDate.get(dateStr) ?? 0;

        // Plazas reservables ocupadas por reservas ese día
        const employeeReserved = [...reserved].filter((id) =>
          reservableIds.has(id)
        ).length;
        const totalAvailable =
          totalOriginalSpots - employeeReserved + cededAvail;

        let status: ResourceDayStatus;

        if (!allowedDays.includes(getDayOfWeek(dateStr))) {
          status = "unavailable";
        } else if (isPast(dateStr)) {
          status = "past";
        } else if (myRes) {
          status = "reserved";
        } else if (totalAvailable <= 0) {
          status = "none";
        } else if (totalAvailable <= FEW_SPOTS_THRESHOLD) {
          status = "few";
        } else {
          status = "plenty";
        }

        const availableCount =
          status !== "unavailable" && status !== "past" && totalAvailable > 0
            ? totalAvailable
            : 0;

        return {
          date: dateStr,
          bookingStatus: status,
          availableCount,
          myReservationId: myRes?.id,
          myReservationSpotLabel: myRes?.spotLabel,
        };
      });
    }
  });
