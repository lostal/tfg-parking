/**
 * Cessations Layout
 *
 * Protected layout for management/admin users only.
 * Employees are redirected to the dashboard.
 */

import { requireManagement } from "@/lib/supabase/auth";

export default async function CessationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireManagement();

  return children;
}
