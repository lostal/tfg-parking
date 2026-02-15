/**
 * Dashboard Layout
 *
 * Protected layout wrapping all authenticated pages.
 * Includes sidebar navigation, header, and auth guard.
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // TODO: Add auth guard — redirect to /login if not authenticated
  return (
    <div className="flex min-h-svh">
      {/* TODO: <Sidebar /> */}
      <div className="flex flex-1 flex-col">
        {/* TODO: <Header /> */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
