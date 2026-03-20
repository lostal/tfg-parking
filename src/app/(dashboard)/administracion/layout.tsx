import { requireAdmin } from "@/lib/auth/helpers";

/**
 * Admin Layout
 *
 * Wraps admin-only pages. Adds role guard (admin only).
 */
export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Require admin role - redirects to /dashboard if not admin
  await requireAdmin();

  return children;
}
