/**
 * UpcomingCessionsList
 *
 * Displays upcoming cessions as a responsive card grid.
 * Color-coded by status: available (emerald), reserved (blue), cancelled (muted).
 * Shows ALL upcoming cessions (no limit).
 */

import { Repeat } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CessionWithDetails } from "@/lib/queries/cessions";

interface UpcomingCessionsListProps {
  cessions: CessionWithDetails[];
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

const STATUS_CONFIG = {
  available: {
    label: "Disponible",
    badge: "secondary" as const,
    card: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40",
    dateBlock: "bg-emerald-600 text-white",
  },
  reserved: {
    label: "Reservada",
    badge: "default" as const,
    card: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40",
    dateBlock: "bg-blue-600 text-white",
  },
  cancelled: {
    label: "Cancelada",
    badge: "outline" as const,
    card: "border-border bg-muted/30 opacity-60",
    dateBlock: "bg-muted text-muted-foreground",
  },
};

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

function getDayLabel(dateStr: string): string {
  if (isToday(dateStr)) return "Hoy";
  if (isTomorrow(dateStr)) return "Mañana";
  return WEEKDAYS_SHORT[parseLocalDate(dateStr).getDay()] ?? "";
}

export function UpcomingCessionsList({ cessions }: UpcomingCessionsListProps) {
  if (cessions.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
        <Repeat className="text-muted-foreground/40 h-8 w-8" />
        <div>
          <p className="text-sm font-medium">Sin cesiones próximas</p>
          <p className="text-muted-foreground text-xs">
            Tu plaza no está cedida próximamente
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cessions.map((c) => {
        const date = parseLocalDate(c.date);
        const dayLabel = getDayLabel(c.date);
        const dayNum = date.getDate();
        const monthStr = date.toLocaleDateString("es-ES", { month: "short" });
        const fullDayName = WEEKDAYS[date.getDay()] ?? "";
        const config =
          STATUS_CONFIG[c.status as keyof typeof STATUS_CONFIG] ??
          STATUS_CONFIG.available;

        return (
          <div
            key={c.id}
            className={`flex flex-col gap-3 overflow-hidden rounded-xl border p-4 transition-shadow hover:shadow-sm ${config.card}`}
          >
            {/* Top row: date block + badge */}
            <div className="flex items-start justify-between gap-2">
              <div
                className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg ${config.dateBlock}`}
              >
                <span className="text-[10px] leading-none font-semibold uppercase opacity-80">
                  {dayLabel}
                </span>
                <span className="text-2xl leading-tight font-bold tabular-nums">
                  {dayNum}
                </span>
                <span className="text-[10px] leading-none opacity-70">
                  {monthStr}
                </span>
              </div>

              <Badge variant={config.badge} className="mt-0.5 shrink-0 text-xs">
                {config.label}
              </Badge>
            </div>

            {/* Spot info */}
            <div>
              <p className="text-base font-semibold">Plaza {c.spot_label}</p>
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
