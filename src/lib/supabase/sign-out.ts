"use server";

/**
 * Sign Out Server Action
 *
 * Patrón recomendado por Supabase para Next.js App Router:
 * https://supabase.com/docs/guides/auth/server-side/nextjs
 *
 * Al ejecutarse en el servidor, el cliente SSR borra correctamente
 * las cookies de sesión antes de que el navegador navegue a /login.
 */

import { redirect } from "next/navigation";
import { createClient } from "./server";
import { ROUTES } from "@/lib/constants";

/** Cierra la sesión actual */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.LOGIN);
}

/** Cierra la sesión en todos los dispositivos */
export async function signOutAllAction() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect(ROUTES.LOGIN);
}
