/**
 * System Configuration Layer
 *
 * Capa tipada de acceso a la configuración del sistema almacenada en `system_config`.
 * Todas las claves conocidas están definidas con sus tipos y valores por defecto,
 * garantizando que la aplicación siempre tenga un valor válido incluso si la BD
 * no contiene la clave (fallback a CONFIG_DEFAULTS).
 *
 * Uso típico en Server Components / Actions:
 *   const maxDays = await getResourceConfig('parking', 'max_advance_days');
 *   const config  = await getAllResourceConfigs('office');
 */

import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Tipos de recurso ─────────────────────────────────────────

export type ResourceType = "parking" | "office";

// ─── Definición de claves de configuración ────────────────────

/** Claves globales (sin prefijo de recurso) */
export type GlobalConfigKey =
  | "notifications_enabled"
  | "email_notifications_enabled"
  | "teams_notifications_enabled";

/** Claves por tipo de recurso (sin prefijo) */
export type ResourceConfigKey =
  | "booking_enabled"
  | "visitor_booking_enabled"
  | "allowed_days"
  | "max_advance_days"
  | "max_consecutive_days"
  | "max_daily_reservations"
  | "max_weekly_reservations"
  | "max_monthly_reservations"
  | "time_slots_enabled"
  | "slot_duration_minutes"
  | "day_start_hour"
  | "day_end_hour"
  | "cession_enabled"
  | "cession_min_advance_hours"
  | "cession_max_per_week"
  | "auto_cession_enabled";

/** Clave completa en la BD (con prefijo de recurso) */
export type FullConfigKey =
  | GlobalConfigKey
  | `parking.${ResourceConfigKey}`
  | `office.${ResourceConfigKey}`;

// ─── Tipos de valor por clave ─────────────────────────────────

export interface ResourceConfigValues {
  booking_enabled: boolean;
  visitor_booking_enabled: boolean;
  allowed_days: number[]; // 0=Dom, 1=Lun, ..., 6=Sáb
  max_advance_days: number;
  max_consecutive_days: number;
  max_daily_reservations: number;
  max_weekly_reservations: number;
  max_monthly_reservations: number;
  time_slots_enabled: boolean;
  slot_duration_minutes: number | null;
  day_start_hour: number | null;
  day_end_hour: number | null;
  cession_enabled: boolean;
  cession_min_advance_hours: number;
  cession_max_per_week: number;
  auto_cession_enabled: boolean;
}

export interface GlobalConfigValues {
  notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  teams_notifications_enabled: boolean;
}

// ─── Valores por defecto ──────────────────────────────────────

const PARKING_DEFAULTS: ResourceConfigValues = {
  booking_enabled: true,
  visitor_booking_enabled: true,
  allowed_days: [1, 2, 3, 4, 5],
  max_advance_days: 14,
  max_consecutive_days: 5,
  max_daily_reservations: 1,
  max_weekly_reservations: 5,
  max_monthly_reservations: 20,
  time_slots_enabled: false,
  slot_duration_minutes: null,
  day_start_hour: null,
  day_end_hour: null,
  cession_enabled: true,
  cession_min_advance_hours: 24,
  cession_max_per_week: 5,
  auto_cession_enabled: false,
};

const OFFICE_DEFAULTS: ResourceConfigValues = {
  booking_enabled: true,
  visitor_booking_enabled: false,
  allowed_days: [1, 2, 3, 4, 5],
  max_advance_days: 7,
  max_consecutive_days: 3,
  max_daily_reservations: 2,
  max_weekly_reservations: 10,
  max_monthly_reservations: 40,
  time_slots_enabled: true,
  slot_duration_minutes: 60,
  day_start_hour: 8,
  day_end_hour: 20,
  cession_enabled: true,
  cession_min_advance_hours: 24,
  cession_max_per_week: 5,
  auto_cession_enabled: false,
};

const GLOBAL_DEFAULTS: GlobalConfigValues = {
  notifications_enabled: true,
  email_notifications_enabled: true,
  teams_notifications_enabled: true,
};

const RESOURCE_DEFAULTS: Record<ResourceType, ResourceConfigValues> = {
  parking: PARKING_DEFAULTS,
  office: OFFICE_DEFAULTS,
};

// ─── Cache tag ────────────────────────────────────────────────

export const CONFIG_CACHE_TAG = "system-config";

// ─── Funciones de acceso ──────────────────────────────────────

/**
 * Carga todas las filas de system_config desde la BD.
 * El resultado se cachea con el tag `system-config`.
 * Se invalida llamando a `revalidateTag(CONFIG_CACHE_TAG)`.
 */
const fetchRawConfigs = unstable_cache(
  async (): Promise<Record<string, unknown>> => {
    // createAdminClient no usa cookies() y el service role bypassa RLS → compatible con unstable_cache
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("system_config")
      .select("key, value");

    if (error) {
      console.error("[config] Error fetching system_config:", error.message);
      return {};
    }

    return Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
  },
  ["system-config-all"],
  {
    tags: [CONFIG_CACHE_TAG],
    revalidate: 300, // 5 minutos como máximo aunque no se invalide explícitamente
  }
);

/**
 * Devuelve todas las configuraciones de un tipo de recurso como un objeto tipado.
 * Si una clave no existe en la BD, usa el valor por defecto de RESOURCE_DEFAULTS.
 */
export async function getAllResourceConfigs(
  resourceType: ResourceType
): Promise<ResourceConfigValues> {
  const raw = await fetchRawConfigs();
  const defaults = RESOURCE_DEFAULTS[resourceType];
  const prefix = `${resourceType}.` as const;

  return {
    booking_enabled:
      raw[`${prefix}booking_enabled`] !== undefined
        ? Boolean(raw[`${prefix}booking_enabled`])
        : defaults.booking_enabled,

    visitor_booking_enabled:
      raw[`${prefix}visitor_booking_enabled`] !== undefined
        ? Boolean(raw[`${prefix}visitor_booking_enabled`])
        : defaults.visitor_booking_enabled,

    allowed_days: Array.isArray(raw[`${prefix}allowed_days`])
      ? (raw[`${prefix}allowed_days`] as number[])
      : defaults.allowed_days,

    max_advance_days:
      typeof raw[`${prefix}max_advance_days`] === "number"
        ? (raw[`${prefix}max_advance_days`] as number)
        : defaults.max_advance_days,

    max_consecutive_days:
      typeof raw[`${prefix}max_consecutive_days`] === "number"
        ? (raw[`${prefix}max_consecutive_days`] as number)
        : defaults.max_consecutive_days,

    max_daily_reservations:
      typeof raw[`${prefix}max_daily_reservations`] === "number"
        ? (raw[`${prefix}max_daily_reservations`] as number)
        : defaults.max_daily_reservations,

    max_weekly_reservations:
      typeof raw[`${prefix}max_weekly_reservations`] === "number"
        ? (raw[`${prefix}max_weekly_reservations`] as number)
        : defaults.max_weekly_reservations,

    max_monthly_reservations:
      typeof raw[`${prefix}max_monthly_reservations`] === "number"
        ? (raw[`${prefix}max_monthly_reservations`] as number)
        : defaults.max_monthly_reservations,

    time_slots_enabled:
      raw[`${prefix}time_slots_enabled`] !== undefined
        ? Boolean(raw[`${prefix}time_slots_enabled`])
        : defaults.time_slots_enabled,

    slot_duration_minutes:
      typeof raw[`${prefix}slot_duration_minutes`] === "number"
        ? (raw[`${prefix}slot_duration_minutes`] as number)
        : defaults.slot_duration_minutes,

    day_start_hour:
      typeof raw[`${prefix}day_start_hour`] === "number"
        ? (raw[`${prefix}day_start_hour`] as number)
        : defaults.day_start_hour,

    day_end_hour:
      typeof raw[`${prefix}day_end_hour`] === "number"
        ? (raw[`${prefix}day_end_hour`] as number)
        : defaults.day_end_hour,

    cession_enabled:
      raw[`${prefix}cession_enabled`] !== undefined
        ? Boolean(raw[`${prefix}cession_enabled`])
        : defaults.cession_enabled,

    cession_min_advance_hours:
      typeof raw[`${prefix}cession_min_advance_hours`] === "number"
        ? (raw[`${prefix}cession_min_advance_hours`] as number)
        : defaults.cession_min_advance_hours,

    cession_max_per_week:
      typeof raw[`${prefix}cession_max_per_week`] === "number"
        ? (raw[`${prefix}cession_max_per_week`] as number)
        : defaults.cession_max_per_week,

    auto_cession_enabled:
      raw[`${prefix}auto_cession_enabled`] !== undefined
        ? Boolean(raw[`${prefix}auto_cession_enabled`])
        : defaults.auto_cession_enabled,
  };
}

/**
 * Devuelve la configuración global del sistema.
 */
export async function getGlobalConfigs(): Promise<GlobalConfigValues> {
  const raw = await fetchRawConfigs();

  return {
    notifications_enabled:
      raw["notifications_enabled"] !== undefined
        ? Boolean(raw["notifications_enabled"])
        : GLOBAL_DEFAULTS.notifications_enabled,

    email_notifications_enabled:
      raw["email_notifications_enabled"] !== undefined
        ? Boolean(raw["email_notifications_enabled"])
        : GLOBAL_DEFAULTS.email_notifications_enabled,

    teams_notifications_enabled:
      raw["teams_notifications_enabled"] !== undefined
        ? Boolean(raw["teams_notifications_enabled"])
        : GLOBAL_DEFAULTS.teams_notifications_enabled,
  };
}

/**
 * Devuelve una sola clave de configuración de recurso con tipo inferido.
 */
export async function getResourceConfig<K extends ResourceConfigKey>(
  resourceType: ResourceType,
  key: K
): Promise<ResourceConfigValues[K]> {
  const config = await getAllResourceConfigs(resourceType);
  return config[key];
}

/**
 * Invalida el cache de configuración.
 * Debe llamarse después de cada mutación en system_config.
 */
export async function invalidateConfigCache(): Promise<void> {
  const { revalidateTag } = await import("next/cache");
  // En Next.js 15, el tipo de revalidateTag requiere 2 argumentos para la nueva
  // API de "use cache"; para unstable_cache sigue funcionando con 1 arg en runtime.
  (revalidateTag as unknown as (tag: string) => void)(CONFIG_CACHE_TAG);
}
