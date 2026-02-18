/**
 * Calendar Page (Deprecated)
 *
 * Redirige a /parking donde ahora se encuentra el calendario
 * como una de las vistas en tabs.
 */

import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

export default function CalendarPage() {
  redirect(ROUTES.PARKING);
}
