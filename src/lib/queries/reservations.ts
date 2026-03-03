/**
 * Queries de Reservas
 *
 * Funciones de servidor para leer datos de reservas.
 */

import { createClient } from "@/lib/supabase/server";
import type { Reservation } from "@/lib/supabase/types";

/** Tipo interno para la query con joins de plaza y perfil */
type ReservationJoin = Reservation & {
  spots: { label: string; resource_type: string } | null;
  profiles: { full_name: string } | null;
};

/**
 * Fila de reserva con etiqueta de plaza, nombre de usuario y campos de oficina.
 * @internal Tipo local a la capa de queries — no usar como tipo público.
 * Para el tipo público compartido ver `ReservationWithDetails` en `@/types`.
 */
export interface ReservationRow extends Reservation {
  spot_label: string;
  user_name: string;
  resource_type: "parking" | "office";
}

/**
 * Obtiene todas las reservas confirmadas para una fecha específica,
 * con detalles de plaza y usuario.
 *
 * @param resourceType - Si se proporciona, filtra por tipo de recurso ('parking' | 'office').
 */
export async function getReservationsByDate(
  date: string,
  resourceType?: "parking" | "office"
): Promise<ReservationRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("reservations")
    .select(
      "*, spots!reservations_spot_id_fkey(label, resource_type), profiles!reservations_user_id_fkey(full_name)"
    )
    .eq("date", date)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  if (resourceType) {
    query = query.eq("spots.resource_type", resourceType);
  }

  const { data, error } = await query.returns<ReservationJoin[]>();

  if (error) throw new Error(`Error al obtener reservas: ${error.message}`);

  return data.map(
    (r): ReservationRow => ({
      id: r.id,
      spot_id: r.spot_id,
      user_id: r.user_id,
      date: r.date,
      status: r.status,
      notes: r.notes,
      start_time: r.start_time,
      end_time: r.end_time,
      created_at: r.created_at,
      updated_at: r.updated_at,
      spot_label: r.spots?.label ?? "",
      user_name: r.profiles?.full_name ?? "",
      resource_type:
        (r.spots?.resource_type as "parking" | "office") ?? "parking",
    })
  );
}

/**
 * Obtiene las reservas confirmadas futuras de un usuario.
 * Devuelve reservas desde hoy en adelante, ordenadas por fecha.
 *
 * @param resourceType - Si se proporciona, filtra por tipo de recurso ('parking' | 'office').
 */
export async function getUserReservations(
  userId: string,
  resourceType?: "parking" | "office"
): Promise<ReservationRow[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0]!;

  let query = supabase
    .from("reservations")
    .select(
      "*, spots!reservations_spot_id_fkey(label, resource_type), profiles!reservations_user_id_fkey(full_name)"
    )
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .gte("date", today)
    .order("date");

  if (resourceType) {
    query = query.eq("spots.resource_type", resourceType);
  }

  const { data, error } = await query.returns<ReservationJoin[]>();

  if (error)
    throw new Error(`Error al obtener reservas del usuario: ${error.message}`);

  return data.map(
    (r): ReservationRow => ({
      id: r.id,
      spot_id: r.spot_id,
      user_id: r.user_id,
      date: r.date,
      status: r.status,
      notes: r.notes,
      start_time: r.start_time,
      end_time: r.end_time,
      created_at: r.created_at,
      updated_at: r.updated_at,
      spot_label: r.spots?.label ?? "",
      user_name: r.profiles?.full_name ?? "",
      resource_type:
        (r.spots?.resource_type as "parking" | "office") ?? "parking",
    })
  );
}

/**
 * Comprueba si un usuario ya tiene una reserva confirmada en una fecha dada.
 * Devuelve la reserva si existe, null en caso contrario.
 */
export async function getUserReservationForDate(
  userId: string,
  date: string
): Promise<Reservation | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .eq("status", "confirmed")
    .maybeSingle();

  if (error) throw new Error(`Error al comprobar reserva: ${error.message}`);

  return data;
}
