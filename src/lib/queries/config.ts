/**
 * Queries de configuración del sistema
 *
 * Funciones de acceso a datos de system_config para el panel de administración.
 * Usadas exclusivamente en Server Components y Server Actions de admin.
 */

import { createClient } from "@/lib/supabase/server";
import type { SystemConfig } from "@/types";

/**
 * Devuelve todas las filas de system_config ordenadas por clave.
 * Para uso en el panel de admin.
 */
export async function fetchAllSystemConfigs(): Promise<SystemConfig[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("system_config")
    .select("*")
    .order("key");

  if (error) throw new Error(`Error al leer configuración: ${error.message}`);
  return data ?? [];
}

/**
 * Devuelve todas las claves con un prefijo dado.
 * Por ejemplo: fetchConfigsByPrefix('parking.') devuelve todas las claves 'parking.*'.
 */
export async function fetchConfigsByPrefix(
  prefix: string
): Promise<SystemConfig[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("system_config")
    .select("*")
    .like("key", `${prefix}%`)
    .order("key");

  if (error) throw new Error(`Error al leer configuración: ${error.message}`);
  return data ?? [];
}

/**
 * Devuelve una sola configuración por clave.
 */
export async function fetchConfig(key: string): Promise<SystemConfig | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("system_config")
    .select("*")
    .eq("key", key)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw new Error(`Error al leer configuración: ${error.message}`);
  }
  return data;
}
