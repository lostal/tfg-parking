/**
 * Supabase Static Client
 *
 * Cliente Supabase sin cookies, apto para uso dentro de `unstable_cache`
 * y otras funciones cacheadas donde no hay contexto de request.
 *
 * Solo se usa para lecturas de tablas con políticas RLS permisivas para `anon`
 * (p.ej. system_config). No envía credenciales de usuario.
 */

import { createClient } from "@supabase/supabase-js";
import { type Database } from "./types";

let _staticClient: ReturnType<typeof createClient<Database>> | null = null;

/**
 * Devuelve un cliente Supabase estático (singleton) con la clave anon.
 * No usa cookies → compatible con unstable_cache y contextos de build.
 */
export function createStaticClient() {
  if (_staticClient) return _staticClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  _staticClient = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return _staticClient;
}
