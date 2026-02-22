/**
 * Parking Calendar View – Contenedor unificado
 *
 * Orquesta la carga de datos, el calendario y los sheets según el rol del usuario.
 * Empleado → sheet de plazas disponibles
 * Directivo → sheet de cesión con multi-selección
 */

"use client";

import * as React from "react";
import { startOfMonth, format } from "date-fns";
import { toast } from "sonner";
import { CalendarCheck, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { Spot } from "@/types";
import {
  type CalendarDayData,
  getCalendarMonthDataSimple,
} from "../calendar-actions";
import { ParkingCalendar, type CalendarRole } from "./parking-calendar";
import { EmployeeDaySheet } from "./employee-day-sheet";
import { ManagementCessionSheet } from "./management-cession-sheet";

interface ParkingCalendarViewProps {
  role: CalendarRole;
  /** Solo para directivo */
  assignedSpot?: Spot | null;
}

export function ParkingCalendarView({
  role,
  assignedSpot,
}: ParkingCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() =>
    startOfMonth(new Date())
  );
  const [dayData, setDayData] = React.useState<Map<string, CalendarDayData>>(
    new Map()
  );
  const [isLoading, setIsLoading] = React.useState(true);

  // ── Estado para sheets ────────────────────────────────────

  // Empleado: fecha del día clicado
  const [employeeSheetDate, setEmployeeSheetDate] = React.useState<
    string | null
  >(null);

  // Directivo: días seleccionados (Set) y estado del sheet
  const [managementSelected, setManagementSelected] = React.useState<
    Set<string>
  >(new Set());
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // ── Carga de datos ────────────────────────────────────────

  const loadMonthData = React.useCallback(async (month: Date) => {
    setIsLoading(true);
    try {
      const monthStart = format(month, "yyyy-MM-dd");
      const result = await getCalendarMonthDataSimple(monthStart);
      if (result.success) {
        const map = new Map<string, CalendarDayData>(
          result.data.map((d) => [d.date, d])
        );
        setDayData(map);
      } else {
        toast.error(result.error ?? "Error al cargar el calendario");
      }
    } catch {
      toast.error("Error al cargar el calendario");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadMonthData(currentMonth);
  }, [currentMonth, loadMonthData]);

  const handleMonthChange = (newMonth: Date) => {
    setCurrentMonth(newMonth);
    setManagementSelected(new Set());
    setSheetOpen(false);
  };

  // ── Click en día ──────────────────────────────────────────

  const handleDayClick = (dateStr: string) => {
    const data = dayData.get(dateStr);
    if (!data) return;

    if (role === "employee") {
      const status = data.employeeStatus;
      if (status === "past" || status === "weekend") return;
      setEmployeeSheetDate(dateStr);
    } else {
      // Directivo: tap-to-toggle
      const status = data.managementStatus;
      if (status !== "can-cede" && status !== "ceded-free") return;
      setManagementSelected((prev) => {
        const next = new Set(prev);
        if (next.has(dateStr)) {
          next.delete(dateStr);
        } else {
          next.add(dateStr);
        }
        return next;
      });
    }
  };

  // ── Refresco tras acción ──────────────────────────────────

  const handleActionSuccess = () => {
    setManagementSelected(new Set());
    setSheetOpen(false);
    loadMonthData(currentMonth);
  };

  return (
    <div className="relative">
      {/* Indicador de carga superpuesto */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Loader2 className="text-muted-foreground size-5 animate-spin" />
        </div>
      )}

      <ParkingCalendar
        role={role}
        dayData={dayData}
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
        selectedDates={managementSelected}
        onDayClick={handleDayClick}
        isLoading={isLoading}
      />

      {/* Sheet empleado */}
      {role === "employee" && (
        <EmployeeDaySheet
          date={employeeSheetDate}
          myReservationId={
            employeeSheetDate
              ? dayData.get(employeeSheetDate)?.myReservationId
              : undefined
          }
          availableCount={
            employeeSheetDate
              ? dayData.get(employeeSheetDate)?.availableCount
              : undefined
          }
          onClose={() => setEmployeeSheetDate(null)}
          onActionSuccess={handleActionSuccess}
        />
      )}

      {/* Barra de confirmación directivo */}
      {role === "management" && assignedSpot && managementSelected.size > 0 && (
        <div className="bg-card mt-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-sm">
          <span className="text-sm font-medium">
            {managementSelected.size}{" "}
            {managementSelected.size === 1
              ? "día seleccionado"
              : "días seleccionados"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setManagementSelected(new Set())}
            >
              <X className="size-3.5" />
              Limpiar
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => setSheetOpen(true)}
            >
              <CalendarCheck className="size-3.5" />
              Confirmar
            </Button>
          </div>
        </div>
      )}

      {/* Sheet directivo */}
      {role === "management" && assignedSpot && (
        <ManagementCessionSheet
          open={sheetOpen}
          selectedDates={managementSelected}
          dayData={dayData}
          spotId={assignedSpot.id}
          spotLabel={assignedSpot.label}
          onClose={() => setSheetOpen(false)}
          onActionSuccess={handleActionSuccess}
        />
      )}

      {/* Aviso si directivo no tiene plaza */}
      {role === "management" && !assignedSpot && (
        <p className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400">
          No tienes asignada una plaza de dirección. Contacta con el
          administrador.
        </p>
      )}
    </div>
  );
}
