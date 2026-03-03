/**
 * Mi Actividad
 *
 * Muestra todas las reservas y cesiones del usuario actual.
 * Las secciones se adaptan según qué recursos tiene asignados el usuario:
 * - Sin plazas asignadas → solo "Reservas" (parking + oficina)
 * - Con ambas plazas → solo "Cesiones" (parking + oficina)
 * - Solo una plaza → dos secciones (Reservas + Cesiones)
 * Admin → redirige al panel.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Car, Building2 } from "lucide-react";

import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getUserReservations } from "@/lib/queries/reservations";
import { getUserCessions } from "@/lib/queries/cessions";
import { getUserOfficeReservations } from "@/lib/queries/offices";
import { Header, Main } from "@/components/layout";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/layout/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { MisReservasClient } from "./_components/mis-reservas-client";

export default async function MisReservasPage() {
  const user = await requireAuth();
  const role = user.profile?.role ?? "employee";

  if (role === "admin") {
    redirect(ROUTES.DASHBOARD);
  }

  const supabase = await createClient();

  const [
    reservations,
    cessions,
    officeReservations,
    parkingSpotResult,
    officeSpotResult,
  ] = await Promise.all([
    getUserReservations(user.id, "parking"),
    getUserCessions(user.id),
    getUserOfficeReservations(user.id),
    supabase
      .from("spots")
      .select("id")
      .eq("assigned_to", user.id)
      .eq("resource_type", "parking")
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("spots")
      .select("id")
      .eq("assigned_to", user.id)
      .eq("resource_type", "office")
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  const hasParkingSpot = !!parkingSpotResult.data;
  const hasOfficeSpot = !!officeSpotResult.data;
  const canReserve = !hasParkingSpot || !hasOfficeSpot;

  const totalRes = reservations.length + officeReservations.length;
  const totalCount = totalRes + cessions.length;
  const countLabel =
    totalCount === 0
      ? "No tienes actividad próxima"
      : [
          totalRes > 0
            ? `${totalRes} reserva${totalRes !== 1 ? "s" : ""}`
            : null,
          cessions.length > 0
            ? `${cessions.length} cesión${cessions.length !== 1 ? "es" : ""}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <>
      <Header fixed>
        <div />
        <div className="ms-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mi Actividad</h1>
            <p className="text-muted-foreground text-sm">{countLabel}</p>
          </div>
          {/* CTAs contextuales: solo aparecen para los recursos que el usuario puede reservar */}
          {canReserve && (
            <div className="flex gap-2">
              {!hasParkingSpot && (
                <Button asChild variant="outline" size="sm">
                  <Link href={ROUTES.PARKING}>
                    <Car className="mr-1.5 size-3.5" />
                    Parking
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Link>
                </Button>
              )}
              {!hasOfficeSpot && (
                <Button asChild variant="outline" size="sm">
                  <Link href={ROUTES.OFFICES}>
                    <Building2 className="mr-1.5 size-3.5" />
                    Oficinas
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>

        <MisReservasClient
          reservations={reservations}
          cessions={cessions}
          officeReservations={officeReservations}
          hasParkingSpot={hasParkingSpot}
          hasOfficeSpot={hasOfficeSpot}
        />
      </Main>
    </>
  );
}
