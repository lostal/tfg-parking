/**
 * Parking Calendar – Vista unificada de calendario
 *
 * Empleado: días coloreados por disponibilidad → click → sheet con plazas
 * Directivo: días coloreados por estado cesión → click/shift+click/drag → ceder
 */

"use client";

import * as React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
  parseISO,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type {
  CalendarDayData,
  EmployeeDayStatus,
  ManagementDayStatus,
} from "../calendar-actions";

// ─── Tipos públicos ──────────────────────────────────────────

export type CalendarRole = "employee" | "management";

export interface ParkingCalendarProps {
  role: CalendarRole;
  /** Datos del mes actual, indexados por fecha "yyyy-MM-dd" */
  dayData: Map<string, CalendarDayData>;
  /** Mes visible (primer día del mes) */
  currentMonth: Date;
  onMonthChange: (newMonth: Date) => void;
  /** Fechas seleccionadas por el directivo (multi-selección) */
  selectedDates?: Set<string>;
  /** Click en un día */
  onDayClick: (date: string, meta: { shiftKey: boolean }) => void;
  /** Drag selection (directivo) – callback con rango final */
  onDragSelect?: (dates: string[]) => void;
  isLoading?: boolean;
}

// ─── Colores por estado ──────────────────────────────────────

const EMPLOYEE_COLORS: Record<EmployeeDayStatus, string> = {
  plenty: "bg-emerald-500 text-white hover:bg-emerald-600",
  few: "bg-amber-400 text-white hover:bg-amber-500",
  none: "bg-rose-500 text-white hover:bg-rose-600",
  reserved: "bg-blue-500 text-white hover:bg-blue-600",
  past: "bg-muted text-muted-foreground cursor-default",
  weekend: "bg-transparent text-muted-foreground/60 cursor-default",
};

const MANAGEMENT_COLORS: Record<ManagementDayStatus, string> = {
  "can-cede": "bg-emerald-500 text-white hover:bg-emerald-600",
  "ceded-free": "bg-orange-400 text-white hover:bg-orange-500",
  "ceded-taken": "bg-blue-500 text-white hover:bg-blue-600",
  "in-use": "bg-muted text-muted-foreground cursor-default",
  past: "bg-muted text-muted-foreground cursor-default",
  weekend: "bg-transparent text-muted-foreground/60 cursor-default",
};

// Tooltip/aria-label por estado
const EMPLOYEE_LABELS: Record<EmployeeDayStatus, string> = {
  plenty: "Plazas disponibles",
  few: "Pocas plazas",
  none: "Sin plazas",
  reserved: "Ya tienes reserva",
  past: "Pasado",
  weekend: "Fin de semana",
};

const MANAGEMENT_LABELS: Record<ManagementDayStatus, string> = {
  "can-cede": "Puedes ceder",
  "ceded-free": "Cedida – sin reservar",
  "ceded-taken": "Cedida y reservada",
  "in-use": "En uso",
  past: "Pasado",
  weekend: "Fin de semana",
};

// ─── Leyenda ─────────────────────────────────────────────────

function CalendarLegend({ role }: { role: CalendarRole }) {
  if (role === "employee") {
    return (
      <div className="flex flex-wrap gap-3 text-xs">
        <LegendItem color="bg-emerald-500" label="Hay plazas" />
        <LegendItem color="bg-amber-400" label="Pocas plazas" />
        <LegendItem color="bg-rose-500" label="Sin plazas" />
        <LegendItem color="bg-blue-500" label="Ya reservaste" />
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      <LegendItem color="bg-emerald-500" label="Puedes ceder" />
      <LegendItem color="bg-orange-400" label="Cedida libre" />
      <LegendItem color="bg-blue-500" label="Cedida y reservada" />
      <LegendItem color="bg-muted border" label="En uso / pasado" />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-block size-3 rounded-full border border-black/10",
          color
        )}
      />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

// ─── Celda de día ────────────────────────────────────────────

interface DayCellProps {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  role: CalendarRole;
  data?: CalendarDayData;
  isSelected?: boolean;
  isDragging?: boolean;
  onPointerDown: (dateStr: string, e: React.PointerEvent) => void;
  onPointerEnter: (dateStr: string) => void;
  onPointerUp: (dateStr: string, e: React.PointerEvent) => void;
  onClick: (dateStr: string, e: React.MouseEvent) => void;
}

function DayCell({
  dateStr,
  dayNumber,
  isCurrentMonth,
  isToday: isTodayFlag,
  role,
  data,
  isSelected,
  onPointerDown,
  onPointerEnter,
  onPointerUp,
  onClick,
}: DayCellProps) {
  if (!isCurrentMonth) {
    return <div className="aspect-square min-h-11 rounded-xl" aria-hidden />;
  }

  const status =
    role === "employee"
      ? (data?.employeeStatus ?? "past")
      : (data?.managementStatus ?? "past");

  const colorClass =
    role === "employee"
      ? EMPLOYEE_COLORS[status as EmployeeDayStatus]
      : MANAGEMENT_COLORS[status as ManagementDayStatus];

  const label =
    role === "employee"
      ? EMPLOYEE_LABELS[status as EmployeeDayStatus]
      : MANAGEMENT_LABELS[status as ManagementDayStatus];

  const isInteractive =
    role === "employee"
      ? !["past", "weekend"].includes(status)
      : status === "can-cede";

  // Para directivo: también seleccionable si ya está cedida (para cancelar)
  const isManagementCancellable =
    role === "management" && status === "ceded-free";

  const canInteract = isInteractive || isManagementCancellable;

  return (
    <button
      type="button"
      aria-label={`${dayNumber} – ${label}`}
      aria-pressed={isSelected}
      disabled={!canInteract}
      className={cn(
        "relative aspect-square min-h-11 w-full rounded-xl text-sm font-semibold select-none",
        "focus-visible:ring-ring transition-all duration-100 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-60",
        colorClass,
        isTodayFlag && "ring-foreground/40 ring-2 ring-offset-1",
        isSelected && "ring-foreground scale-95 ring-2 ring-offset-1"
        // Tamaño touch-friendly en móvil garantizado por min-h + aspect-square
      )}
      onPointerDown={(e) => onPointerDown(dateStr, e)}
      onPointerEnter={() => onPointerEnter(dateStr)}
      onPointerUp={(e) => onPointerUp(dateStr, e)}
      onClick={(e) => onClick(dateStr, e)}
    >
      <span className="relative z-10">{dayNumber}</span>
      {/* Indicador de disponibilidad para empleado */}
      {role === "employee" &&
        data?.availableCount !== undefined &&
        status !== "reserved" && (
          <span className="absolute bottom-[14%] left-1/2 -translate-x-1/2 text-[9px] leading-none opacity-80">
            {data.availableCount > 0 ? data.availableCount : ""}
          </span>
        )}
    </button>
  );
}

// ─── Componente Principal ─────────────────────────────────────

export function ParkingCalendar({
  role,
  dayData,
  currentMonth,
  onMonthChange,
  selectedDates = new Set(),
  onDayClick,
  onDragSelect,
  isLoading,
}: ParkingCalendarProps) {
  const [dragAnchor, setDragAnchor] = React.useState<string | null>(null);
  const [dragEnd, setDragEnd] = React.useState<string | null>(null);
  const isDragging = dragAnchor !== null;

  // Construir las semanas del mes (siempre 6 semanas visuales para estabilidad)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Lunes
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weeks: Date[][] = [];
  let day = calStart;
  while (day <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  // Calcular rango de drag
  const dragRange = React.useMemo((): Set<string> => {
    if (!dragAnchor || !dragEnd) return new Set();
    const a = parseISO(dragAnchor);
    const b = parseISO(dragEnd);
    const [from, to] = a <= b ? [a, b] : [b, a];
    const range = new Set<string>();
    let cur = from;
    while (cur <= to) {
      const str = format(cur, "yyyy-MM-dd");
      const data = dayData.get(str);
      // Solo incluir días cedibles o ya cedidos-libres
      if (
        data?.managementStatus === "can-cede" ||
        data?.managementStatus === "ceded-free"
      ) {
        range.add(str);
      }
      cur = addDays(cur, 1);
    }
    return range;
  }, [dragAnchor, dragEnd, dayData]);

  // Handlers de drag (solo directivo)
  const handlePointerDown = (dateStr: string, e: React.PointerEvent) => {
    if (role !== "management") return;
    const data = dayData.get(dateStr);
    if (
      data?.managementStatus !== "can-cede" &&
      data?.managementStatus !== "ceded-free"
    )
      return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragAnchor(dateStr);
    setDragEnd(dateStr);
  };

  const handlePointerEnter = (dateStr: string) => {
    if (!isDragging) return;
    setDragEnd(dateStr);
  };

  const handlePointerUp = (_dateStr: string, _e: React.PointerEvent) => {
    if (!isDragging) return;
    const finalRange = Array.from(dragRange);
    setDragAnchor(null);
    setDragEnd(null);
    if (finalRange.length > 1 && onDragSelect) {
      onDragSelect(finalRange);
    }
  };

  const handleDayClick = (dateStr: string, e: React.MouseEvent) => {
    onDayClick(dateStr, { shiftKey: e.shiftKey });
  };

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="space-y-4">
      {/* Header navegación de mes */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <h3 className="text-base font-semibold capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </h3>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((wd) => (
          <div
            key={wd}
            className="text-muted-foreground py-1 text-center text-xs font-medium"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Grid del mes */}
      <div
        className={cn(
          "grid touch-none grid-cols-7 gap-1",
          isLoading && "pointer-events-none opacity-40"
        )}
        // Prevenir scroll mientras se arrastra
        onPointerLeave={() => {
          if (
            isDragging &&
            dragAnchor &&
            dragEnd &&
            dragRange.size > 0 &&
            onDragSelect
          ) {
            onDragSelect(Array.from(dragRange));
          }
          if (isDragging) {
            setDragAnchor(null);
            setDragEnd(null);
          }
        }}
      >
        {weeks.map((week) =>
          week.map((date) => {
            const dateStr = format(date, "yyyy-MM-dd");
            const inCurrentMonth = isSameMonth(date, currentMonth);
            const today = isToday(date);
            const data = dayData.get(dateStr);
            const isInDrag = dragRange.has(dateStr);
            const isSelected = selectedDates.has(dateStr) || isInDrag;

            return (
              <DayCell
                key={dateStr}
                dateStr={dateStr}
                dayNumber={date.getDate()}
                isCurrentMonth={inCurrentMonth}
                isToday={today}
                role={role}
                data={data}
                isSelected={isSelected}
                isDragging={isInDrag}
                onPointerDown={handlePointerDown}
                onPointerEnter={handlePointerEnter}
                onPointerUp={handlePointerUp}
                onClick={handleDayClick}
              />
            );
          })
        )}
      </div>

      {/* Leyenda */}
      <CalendarLegend role={role} />

      {role === "management" && (
        <p className="text-muted-foreground text-xs">
          <kbd className="border-border rounded border px-1 py-0.5 font-mono text-[10px]">
            Shift
          </kbd>
          {" + clic"} o arrastra para seleccionar un rango de días
        </p>
      )}
    </div>
  );
}
