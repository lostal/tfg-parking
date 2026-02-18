/**
 * UpcomingReservationsList
 *
 * Displays upcoming reservations as a responsive card grid.
 * "Today" cards are highlighted in primary color.
 * Shows ALL upcoming reservations (no limit).
 */

import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ReservationWithDetails } from "@/lib/queries/reservations";

interface UpcomingReservationsListProps {
  reservations: ReservationWithDetails[];
}

const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];
const WEEKDAYS_SHORT = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split("T")[0];
}

function isTomorrow(dateStr: string): boolean {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return dateStr === d.toISOString().split("T")[0];
}

function isThisWeek(dateStr: string): boolean {
  const d = parseLocalDate(dateStr);
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 6;
}

function getDayLabel(dateStr: string): string {
  if (isToday(dateStr)) return "Hoy";
  if (isTomorrow(dateStr)) return "Mañana";
  return WEEKDAYS_SHORT[parseLocalDate(dateStr).getDay()] ?? "";
}

export function UpcomingReservationsList({
  reservations,
}: UpcomingReservationsListProps) {
  if (reservations.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
        <CalendarDays className="text-muted-foreground/40 h-8 w-8" />
        <div>
          <p className="text-sm font-medium">Sin reservas próximas</p>
          <p className="text-muted-foreground text-xs">
            Ve a Reservas para reservar una plaza
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {reservations.map((res) => {
        const date = parseLocalDate(res.date);
        const today = isToday(res.date);
        const tomorrow = isTomorrow(res.date);
        const thisWeek = isThisWeek(res.date);
        const dayLabel = getDayLabel(res.date);
        const dayNum = date.getDate();
        const monthStr = date.toLocaleDateString("es-ES", { month: "short" });
        const fullDayName = WEEKDAYS[date.getDay()] ?? "";

        return (
          <div
            key={res.id}
            className={`group relative flex flex-col gap-3 overflow-hidden rounded-xl border p-4 transition-shadow hover:shadow-sm ${
              today
                ? "border-primary/40 bg-primary/5"
                : thisWeek
                  ? "border-border bg-card"
                  : "border-border bg-card opacity-90"
            }`}
          >
            {/* Top row: date block + badge */}
            <div className="flex items-start justify-between gap-2">
              {/* Date block */}
              <div
                className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg ${
                  today
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <span className="text-[10px] leading-none font-semibold uppercase opacity-70">
                  {dayLabel}
                </span>
                <span className="text-2xl leading-tight font-bold tabular-nums">
                  {dayNum}
                </span>
                <span className="text-[10px] leading-none opacity-60">
                  {monthStr}
                </span>
              </div>

              {/* Status badge */}
              <Badge
                variant={today ? "default" : tomorrow ? "secondary" : "outline"}
                className="mt-0.5 shrink-0 text-xs"
              >
                {today ? "Hoy" : tomorrow ? "Mañana" : "Confirmada"}
              </Badge>
            </div>

            {/* Spot info */}
            <div>
              <p className="text-base font-semibold">Plaza {res.spot_label}</p>
              <p className="text-muted-foreground text-xs capitalize">
                {fullDayName},{" "}
                {date.toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
