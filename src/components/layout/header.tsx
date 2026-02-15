/**
 * Header Component
 *
 * Top bar with user menu, mobile nav trigger, breadcrumbs.
 */

export function Header() {
  return (
    <header className="flex h-14 items-center border-b px-4 md:px-6">
      {/* TODO: Mobile menu trigger */}
      <div className="flex-1" />
      {/* TODO: User avatar + dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">Usuario</span>
      </div>
    </header>
  );
}
