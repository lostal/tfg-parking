/**
 * Dashboard Home Page
 *
 * Landing page after login. Shows summary of today's parking status,
 * user's reservations, and quick actions.
 */
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        Bienvenido al sistema de parking de GRUPOSIETE.
      </p>
    </div>
  );
}
