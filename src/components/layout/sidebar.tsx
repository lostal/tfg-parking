/**
 * Sidebar Component
 *
 * Main navigation sidebar for the dashboard.
 * Responsive: full sidebar on desktop, sheet on mobile.
 */

export function Sidebar() {
  return (
    <aside className="bg-sidebar hidden w-64 border-r md:block">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-semibold">Parking</span>
      </div>
      <nav className="space-y-1 p-2">
        {/* TODO: Navigation items */}
        <p className="text-muted-foreground px-3 py-2 text-sm">
          Navegación pendiente
        </p>
      </nav>
    </aside>
  );
}
