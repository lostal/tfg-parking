/**
 * Cessations Layout
 *
 * Protected layout: requiere tener plaza de parking asignada.
 * Cualquier empleado con plaza asignada puede acceder a sus cesiones.
 */

import { requireSpotOwner } from "@/lib/auth/helpers";

export default async function CessationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSpotOwner("parking");

  return children;
}
