/**
 * My Cessations Page (Management/Admin) – Redirects to /parking
 *
 * La vista de cesiones ahora está integrada en el calendario unificado de /parking.
 */

import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

export default function MyCessationsPage() {
  redirect(ROUTES.PARKING);
}
