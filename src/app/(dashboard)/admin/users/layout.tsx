import { requireAdmin } from "@/lib/supabase/auth";

/**
 * Admin Users Layout — inherits admin role guard.
 */
export default async function AdminUsersLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return children;
}
