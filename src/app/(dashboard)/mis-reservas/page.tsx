/**
 * Mis Reservas / Mis Cesiones
 *
 * Employee  → muestra todas sus reservas futuras como tarjetas visuales.
 * Management → muestra todas sus cesiones futuras como tarjetas visuales.
 * Admin      → redirige al panel.
 */

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/supabase/auth";
import { getUserReservations } from "@/lib/queries/reservations";
import { getUserCessions } from "@/lib/queries/cessions";
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
import { ROUTES } from "@/lib/constants";
import { UpcomingReservationsList } from "../inicio/_components/upcoming-reservations-list";
import { UpcomingCessionsList } from "../inicio/_components/upcoming-cessions-list";

export default async function MisReservasPage() {
  const user = await requireAuth();
  const role = user.profile?.role ?? "employee";

  if (role === "admin") {
    redirect(ROUTES.DASHBOARD);
  }

  const isManagement = role === "management";

  const [reservations, cessions] = await Promise.all([
    !isManagement ? getUserReservations(user.id) : Promise.resolve([]),
    isManagement ? getUserCessions(user.id) : Promise.resolve([]),
  ]);

  const title = isManagement ? "Mis Cesiones" : "Mis Reservas";
  const description = isManagement
    ? "Días en los que has cedido o programado ceder tu plaza asignada"
    : "Tus próximas reservas de plaza confirmadas";
  const count = isManagement ? cessions.length : reservations.length;
  const countLabel = isManagement
    ? `${count} cesión${count !== 1 ? "es" : ""} programada${count !== 1 ? "s" : ""}`
    : `${count} reserva${count !== 1 ? "s" : ""} confirmada${count !== 1 ? "s" : ""}`;
  const emptyLabel = isManagement
    ? "No tienes cesiones próximas"
    : "No tienes reservas próximas";

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {count > 0 ? countLabel : emptyLabel}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isManagement ? (
              <UpcomingCessionsList cessions={cessions} />
            ) : (
              <UpcomingReservationsList reservations={reservations} />
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
