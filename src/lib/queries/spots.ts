/**
 * Queries de Plazas
 *
 * Funciones de servidor para leer datos de plazas de aparcamiento.
 * Solo para Server Components — NO usar en componentes cliente.
 */

import { createClient } from "@/lib/supabase/server";
import type { Spot } from "@/lib/supabase/types";
import type { SpotWithStatus, SpotStatus } from "@/types";

/** Tipo interno para la query de reservas con perfil del usuario */
type ReservationConPerfil = {
  id: string;
  spot_id: string;
  user_id: string;
  profiles: { full_name: string } | null;
};

/**
 * Obtiene todas las plazas activas (sin estado por fecha).
 * Usada por el panel admin para la gestión CRUD.
 */
export async function getSpots(): Promise<Spot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .eq("is_active", true)
    .order("label");

  if (error) throw new Error(`Error al obtener plazas: ${error.message}`);
  return data;
}

/**
 * Obtiene todas las plazas activas con estado calculado para una fecha específica.
 *
 * Lógica de estado:
 * - Plaza de dirección sin cesión en esa fecha → "occupied" (asignada)
 * - Plaza de dirección con cesión (available) → "ceded" (libre para reservar)
 * - Plaza de dirección con cesión (reserved) → "reserved"
 * - Plaza estándar con reserva confirmada → "reserved"
 * - Plaza con reserva de visitante confirmada → "visitor-blocked"
 * - En cualquier otro caso → "free"
 */
export async function getSpotsByDate(date: string): Promise<SpotWithStatus[]> {
  const supabase = await createClient();

  // Obtener todos los datos en paralelo
  const [spotsResult, reservationsResult, cessionsResult, visitorResult] =
    await Promise.all([
      supabase.from("spots").select("*").eq("is_active", true).order("label"),
      supabase
        .from("reservations")
        .select(
          "id, spot_id, user_id, profiles!reservations_user_id_fkey(full_name)"
        )
        .eq("date", date)
        .eq("status", "confirmed")
        .returns<ReservationConPerfil[]>(),
      supabase
        .from("cessions")
        .select("id, spot_id, status")
        .eq("date", date)
        .neq("status", "cancelled"),
      supabase
        .from("visitor_reservations")
        .select("id, spot_id, visitor_name")
        .eq("date", date)
        .eq("status", "confirmed"),
    ]);

  if (spotsResult.error)
    throw new Error(`Error al obtener plazas: ${spotsResult.error.message}`);

  const spots = spotsResult.data;
  const reservations = reservationsResult.data ?? [];
  const cessions = cessionsResult.data ?? [];
  const visitorReservations = visitorResult.data ?? [];

  // Construir mapas de búsqueda O(1)
  const reservationBySpot = new Map(reservations.map((r) => [r.spot_id, r]));
  const cessionBySpot = new Map(cessions.map((c) => [c.spot_id, c]));
  const visitorBySpot = new Map(visitorReservations.map((v) => [v.spot_id, v]));

  return spots.map((spot): SpotWithStatus => {
    let status: SpotStatus = "free";
    let reservation_id: string | undefined;
    let reserved_by_name: string | undefined;

    const reservation = reservationBySpot.get(spot.id);
    const cession = cessionBySpot.get(spot.id);
    const visitor = visitorBySpot.get(spot.id);

    if (visitor) {
      // La reserva de visitante tiene prioridad
      status = "visitor-blocked";
      reservation_id = visitor.id;
      reserved_by_name = visitor.visitor_name;
    } else if (reservation) {
      status = "reserved";
      reservation_id = reservation.id;
      reserved_by_name = reservation.profiles?.full_name ?? undefined;
    } else if (spot.type === "management") {
      if (cession) {
        // La plaza de dirección ha sido cedida
        status = cession.status === "reserved" ? "reserved" : "ceded";
        reservation_id = cession.id;
      } else {
        // Plaza de dirección no cedida → ocupada por el asignado
        status = "occupied";
      }
    }

    return {
      id: spot.id,
      label: spot.label,
      type: spot.type,
      assigned_to: spot.assigned_to,
      position_x: spot.position_x,
      position_y: spot.position_y,
      status,
      reservation_id,
      reserved_by_name,
    };
  });
}
