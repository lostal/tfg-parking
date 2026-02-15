/**
 * Admin Layout
 *
 * Wraps admin-only pages. Adds role guard (admin only).
 */
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // TODO: Role guard — redirect if user is not admin
  return children;
}
