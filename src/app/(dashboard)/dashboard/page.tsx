/**
 * Dashboard Home Page
 *
 * Server Component that fetches parking data and renders
 * an adaptive dashboard based on the user's role.
 */

import { requireAuth } from "@/lib/supabase/auth";
import { getSpotsByDate } from "@/lib/queries/spots";
import { getUserReservations } from "@/lib/queries/reservations";
import { getProfiles } from "@/lib/queries/profiles";
import { createClient } from "@/lib/supabase/server";
import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardTopNav } from "./_components/dashboard-top-nav";
import { StatsCards } from "./_components/stats-cards";
import { RecentReservations } from "./_components/recent-reservations";
import { MySpotCard } from "./_components/my-spot-card";
import { AdminAlerts } from "./_components/admin-alerts";

export default async function DashboardPage() {
  const user = await requireAuth();
  const role = user.profile?.role ?? "employee";
  const today = new Date().toISOString().split("T")[0]!;

  // Fetch data in parallel
  const [spots, userReservations] = await Promise.all([
    getSpotsByDate(today),
    getUserReservations(user.id),
  ]);

  // Compute stats
  const totalSpots = spots.length;
  const freeSpots = spots.filter(
    (s) => s.status === "free" || s.status === "ceded"
  ).length;
  const cededSpots = spots.filter((s) => s.status === "ceded").length;

  // Count visitor reservations for today
  const supabase = await createClient();
  const { count: visitorsToday } = await supabase
    .from("visitor_reservations")
    .select("id", { count: "exact", head: true })
    .eq("date", today)
    .eq("status", "confirmed");

  // Next reservation
  const nextReservation =
    userReservations.length > 0
      ? {
          spotLabel: userReservations[0]!.spot_label,
          date: formatDate(userReservations[0]!.date),
        }
      : null;

  // Role-specific data
  const userSpot =
    role !== "employee" ? spots.find((s) => s.assigned_to === user.id) : null;

  let pendingManagement: Awaited<ReturnType<typeof getProfiles>> = [];
  let occupancyPercent = 0;

  if (role === "admin") {
    const profiles = await getProfiles();
    pendingManagement = profiles.filter(
      (p) =>
        p.role === "management" && !spots.some((s) => s.assigned_to === p.id)
    );

    const occupiedSpots = spots.filter(
      (s) =>
        s.status === "reserved" ||
        s.status === "occupied" ||
        s.status === "visitor-blocked"
    ).length;
    occupancyPercent =
      totalSpots > 0 ? Math.round((occupiedSpots / totalSpots) * 100) : 0;
  }

  // Determine grid layout based on role
  const hasRightPanel = role !== "employee";

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header fixed>
        <DashboardTopNav />
        <div className="ml-auto flex items-center gap-2">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {formatDateLong(today)}
          </p>
        </div>

        <div className="space-y-4">
          {/* Stats Cards */}
          <StatsCards
            freeSpots={freeSpots}
            totalSpots={totalSpots}
            nextReservation={nextReservation}
            cededSpots={cededSpots}
            visitorsToday={visitorsToday ?? 0}
          />

          {/* Content Row */}
          <div
            className={`grid grid-cols-1 gap-4 ${
              hasRightPanel ? "lg:grid-cols-7" : ""
            }`}
          >
            {/* Recent Reservations */}
            <Card className={hasRightPanel ? "col-span-1 lg:col-span-4" : ""}>
              <CardHeader>
                <CardTitle>Mis reservas próximas</CardTitle>
                <CardDescription>
                  {userReservations.length > 0
                    ? `Tienes ${userReservations.length} reserva${userReservations.length !== 1 ? "s" : ""} próxima${userReservations.length !== 1 ? "s" : ""}`
                    : "No tienes reservas próximas"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentReservations reservations={userReservations} />
              </CardContent>
            </Card>

            {/* Right Panel: Management gets MySpotCard, Admin gets AdminAlerts */}
            {role !== "employee" && (
              <Card className="col-span-1 lg:col-span-3">
                {role === "admin" ? (
                  <>
                    <CardHeader>
                      <CardTitle>Panel de administración</CardTitle>
                      <CardDescription>
                        Alertas y estado del sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AdminAlerts
                        pendingManagement={pendingManagement}
                        occupancyPercent={occupancyPercent}
                      />
                    </CardContent>
                  </>
                ) : (
                  <>
                    <CardHeader>
                      <CardTitle>Mi plaza</CardTitle>
                      <CardDescription>
                        Estado de tu plaza asignada hoy
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userSpot ? (
                        <MySpotCard spot={userSpot} />
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No tienes plaza asignada. Contacta con el
                          administrador.
                        </p>
                      )}
                    </CardContent>
                  </>
                )}
              </Card>
            )}
          </div>
        </div>
      </Main>
    </>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
