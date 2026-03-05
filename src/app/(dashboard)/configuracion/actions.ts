"use server";

/**
 * Acciones de configuración del sistema (solo admin)
 *
 * Permite al administrador leer y modificar los valores de system_config.
 * Cada mutación invalida el cache de configuración para que los cambios
 * se reflejen inmediatamente en toda la aplicación.
 */

import { actionClient } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { revalidatePath } from "next/cache";
import { invalidateConfigCache } from "@/lib/config";
import {
  updateGlobalConfigSchema,
  updateResourceConfigSchema,
  type UpdateResourceConfigInput,
} from "@/lib/validations";

// ─── Helper interno ───────────────────────────────────────────

/**
 * Actualiza (o inserta) múltiples claves en system_config dentro de una
 * sola transacción lógica. Usa upsert para garantizar idempotencia.
 */
async function upsertConfigs(
  entries: Array<{ key: string; value: unknown }>,
  adminUserId: string
): Promise<void> {
  const supabase = await createClient();

  const rows = entries.map(({ key, value }) => ({
    key,
    value: value as never, // JSONB acepta cualquier tipo serializable
    updated_by: adminUserId,
  }));

  const { error } = await supabase
    .from("system_config")
    .upsert(rows, { onConflict: "key" });

  if (error) {
    throw new Error(`Error al guardar configuración: ${error.message}`);
  }
}

/**
 * Convierte un objeto de configuración de recurso al formato de filas
 * de system_config con prefijo.
 */
function resourceConfigToEntries(
  resourceType: "parking" | "office",
  config: UpdateResourceConfigInput
): Array<{ key: string; value: unknown }> {
  const prefix = `${resourceType}.`;
  return Object.entries(config).map(([key, value]) => ({
    key: `${prefix}${key}`,
    value,
  }));
}

// ─── Actualizar configuración global ─────────────────────────

export const updateGlobalConfig = actionClient
  .schema(updateGlobalConfigSchema)
  .action(async ({ parsedInput }) => {
    const adminUser = await requireAdmin();

    const entries = Object.entries(parsedInput).map(([key, value]) => ({
      key,
      value,
    }));

    await upsertConfigs(entries, adminUser.id);
    await invalidateConfigCache();
    revalidatePath("/configuracion/general");

    return { updated: true };
  });

// ─── Actualizar configuración de parking ─────────────────────

export const updateParkingConfig = actionClient
  .schema(updateResourceConfigSchema)
  .action(async ({ parsedInput }) => {
    const adminUser = await requireAdmin();

    const entries = resourceConfigToEntries("parking", parsedInput);
    await upsertConfigs(entries, adminUser.id);
    await invalidateConfigCache();
    revalidatePath("/configuracion/parking");
    revalidatePath("/parking");

    return { updated: true };
  });

// ─── Actualizar configuración de oficinas ────────────────────

export const updateOfficeConfig = actionClient
  .schema(updateResourceConfigSchema)
  .action(async ({ parsedInput }) => {
    const adminUser = await requireAdmin();

    const entries = resourceConfigToEntries("office", parsedInput);
    await upsertConfigs(entries, adminUser.id);
    await invalidateConfigCache();
    revalidatePath("/configuracion/oficinas");
    revalidatePath("/oficinas");

    return { updated: true };
  });
