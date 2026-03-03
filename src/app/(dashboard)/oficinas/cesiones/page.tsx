/**
 * Office Cesiones Page
 *
 * La vista de cesiones de oficinas está integrada en el calendario de /oficinas.
 */

import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

export default function OfficeCesionesPage() {
  redirect(ROUTES.OFFICES);
}
