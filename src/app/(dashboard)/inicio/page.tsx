import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

/** /inicio ya no es la página principal — redirigir a /reservas */
export default function InicioPage() {
  redirect(ROUTES.PARKING);
}
