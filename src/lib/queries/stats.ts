/**
 * Stats Queries
 *
 * Server-side functions for admin dashboard analytics.
 * All functions require admin role — call only from admin pages.
 */

import { createClient } from "@/lib/supabase/server";

export interface DailyCount {
  /** ISO date string e.g. "2025-01-15" */
  date: string;
  /** Short label e.g. "15 ene" */
  label: string;
  reservations: number;
  visitors: number;
}

export interface SpotUsage {
  spot_label: string;
  count: number;
}

export interface MovementDistribution {
  name: string;
  value: number;
}

/**
 * Returns per-day reservation + visitor counts for the last N days.
 * Used by the admin bar chart.
 */
export async function getDailyCountsLast30Days(
  days = 30
): Promise<DailyCount[]> {
  const supabase = await createClient();

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));

  const startStr = startDate.toISOString().split("T")[0]!;
  const endStr = endDate.toISOString().split("T")[0]!;

  const [reservationsResult, visitorsResult] = await Promise.all([
    supabase
      .from("reservations")
      .select("date")
      .eq("status", "confirmed")
      .gte("date", startStr)
      .lte("date", endStr),
    supabase
      .from("visitor_reservations")
      .select("date")
      .eq("status", "confirmed")
      .gte("date", startStr)
      .lte("date", endStr),
  ]);

  // Build a map of date → counts
  const countsByDate = new Map<
    string,
    { reservations: number; visitors: number }
  >();

  // Initialize all days to 0
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0]!;
    countsByDate.set(dateStr, { reservations: 0, visitors: 0 });
  }

  for (const r of reservationsResult.data ?? []) {
    const entry = countsByDate.get(r.date);
    if (entry) entry.reservations++;
  }

  for (const v of visitorsResult.data ?? []) {
    const entry = countsByDate.get(v.date);
    if (entry) entry.visitors++;
  }

  return Array.from(countsByDate.entries()).map(([date, counts]) => {
    const d = new Date(date + "T00:00:00");
    const label = d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
    return { date, label, ...counts };
  });
}

/**
 * Returns the top N spots by confirmed reservation count this month.
 */
export async function getTopSpots(limit = 6): Promise<SpotUsage[]> {
  const supabase = await createClient();

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0]!;
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0]!;

  const { data, error } = await supabase
    .from("reservations")
    .select("*, spots!reservations_spot_id_fkey(label)")
    .eq("status", "confirmed")
    .gte("date", firstOfMonth)
    .lte("date", lastOfMonth);

  if (error) return [];

  // Aggregate by spot
  const countBySpot = new Map<string, number>();
  for (const r of data) {
    const spot = r.spots as unknown as { label: string } | null;
    const label = spot?.label ?? "—";
    countBySpot.set(label, (countBySpot.get(label) ?? 0) + 1);
  }

  return Array.from(countBySpot.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([spot_label, count]) => ({ spot_label, count }));
}

/**
 * Returns the distribution of movement types for the current month.
 */
export async function getMovementDistribution(): Promise<
  MovementDistribution[]
> {
  const supabase = await createClient();

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0]!;
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0]!;

  const [resResult, cesResult, visResult] = await Promise.all([
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed")
      .gte("date", firstOfMonth)
      .lte("date", lastOfMonth),
    supabase
      .from("cessions")
      .select("id", { count: "exact", head: true })
      .neq("status", "cancelled")
      .gte("date", firstOfMonth)
      .lte("date", lastOfMonth),
    supabase
      .from("visitor_reservations")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed")
      .gte("date", firstOfMonth)
      .lte("date", lastOfMonth),
  ]);

  return [
    { name: "Reservas empleados", value: resResult.count ?? 0 },
    { name: "Cesiones dirección", value: cesResult.count ?? 0 },
    { name: "Visitantes", value: visResult.count ?? 0 },
  ];
}

/**
 * Returns total confirmed reservations for the current month.
 */
export async function getMonthlyReservationCount(): Promise<number> {
  const supabase = await createClient();

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0]!;
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0]!;

  const { count } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed")
    .gte("date", firstOfMonth)
    .lte("date", lastOfMonth);

  return count ?? 0;
}

export interface RecentActivity {
  id: string;
  user_name: string;
  spot_label: string;
  date: string;
  type: "reservation" | "visitor";
  visitor_name?: string;
}

/**
 * Returns the last N confirmed reservations + visitor reservations (combined, sorted by created_at).
 * Used by the admin "Actividad reciente" panel.
 */
export async function getRecentActivity(limit = 8): Promise<RecentActivity[]> {
  const supabase = await createClient();

  const [resResult, visResult] = await Promise.all([
    supabase
      .from("reservations")
      .select(
        "id, date, created_at, spots!reservations_spot_id_fkey(label), profiles!reservations_user_id_fkey(full_name)"
      )
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("visitor_reservations")
      .select(
        "id, date, created_at, visitor_name, spots!visitor_reservations_spot_id_fkey(label)"
      )
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  type ActivityWithTime = RecentActivity & { created_at: string };

  const reservations: ActivityWithTime[] = (resResult.data ?? []).map((r) => {
    const spot = r.spots as unknown as { label: string } | null;
    const profile = r.profiles as unknown as { full_name: string } | null;
    return {
      id: r.id,
      user_name: profile?.full_name ?? "Usuario",
      spot_label: spot?.label ?? "—",
      date: r.date,
      type: "reservation" as const,
      created_at: r.created_at,
    };
  });

  const visitors: ActivityWithTime[] = (visResult.data ?? []).map((v) => {
    const spot = v.spots as unknown as { label: string } | null;
    return {
      id: v.id,
      user_name: v.visitor_name ?? "Visitante",
      spot_label: spot?.label ?? "—",
      date: v.date,
      type: "visitor" as const,
      visitor_name: v.visitor_name ?? undefined,
      created_at: v.created_at,
    };
  });

  return [...reservations, ...visitors]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit)
    .map(({ created_at: _, ...item }) => item);
}

export async function getActiveUsersThisMonth(): Promise<number> {
  const supabase = await createClient();

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0]!;
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0]!;

  const { data } = await supabase
    .from("reservations")
    .select("user_id")
    .eq("status", "confirmed")
    .gte("date", firstOfMonth)
    .lte("date", lastOfMonth);

  const uniqueUsers = new Set((data ?? []).map((r) => r.user_id));
  return uniqueUsers.size;
}
