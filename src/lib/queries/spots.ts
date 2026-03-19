/**
 * Queries de Plazas
 *
 * Funciones de servidor para leer datos de plazas y espacios.
 * Solo para Server Components — NO usar en componentes cliente.
 */

import { db } from "@/lib/db";
import {
  spots as spotsTable,
  reservations as reservationsTable,
  cessions as cessionsTable,
  visitorReservations as visitorReservationsTable,
  profiles as profilesTable,
} from "@/lib/db/schema";
import type { Spot } from "@/lib/db/types";
import type { SpotWithStatus, SpotStatus } from "@/types";
import { eq, and, or, isNull, ne } from "drizzle-orm";

/**
 * Obtiene plazas (sin estado por fecha).
 * Usada por el panel admin para la gestión CRUD.
 *
 * @param resourceType - Si se proporciona, filtra por tipo de recurso
 *   ('parking' | 'office'). Sin filtro devuelve todas.
 * @param includeInactive - Si es true, incluye plazas inactivas. Por defecto false.
 * @param entityId - Si se proporciona, filtra por sede (entity_id).
 */
export async function getSpots(
  resourceType?: "parking" | "office",
  includeInactive = false,
  entityId?: string | null
): Promise<Spot[]> {
  const conditions = [];

  if (!includeInactive) {
    conditions.push(eq(spotsTable.isActive, true));
  }

  if (resourceType) {
    conditions.push(eq(spotsTable.resourceType, resourceType));
  }

  if (entityId) {
    conditions.push(
      or(eq(spotsTable.entityId, entityId), isNull(spotsTable.entityId))!
    );
  }

  try {
    const rows = await db
      .select()
      .from(spotsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(spotsTable.label);

    return rows;
  } catch (err) {
    console.error("[spots] getSpots query error", err);
    throw new Error("No se pudieron obtener las plazas");
  }
}

/**
 * Obtiene todas las plazas activas con estado calculado para una fecha específica.
 *
 * @param resourceType - Si se proporciona, filtra por tipo de recurso ('parking' | 'office').
 * @param entityId - Si se proporciona, filtra las plazas por sede (entity_id).
 *
 * Lógica de estado:
 * - Plaza asignada sin cesión en esa fecha → "occupied" (asignada)
 * - Plaza asignada con cesión (available) → "ceded" (libre para reservar)
 * - Plaza asignada con cesión (reserved) → "reserved"
 * - Plaza estándar con reserva confirmada → "reserved"
 * - Plaza con reserva de visitante confirmada → "visitor-blocked"
 * - En cualquier otro caso → "free"
 */
export async function getSpotsByDate(
  date: string,
  resourceType?: "parking" | "office",
  entityId?: string | null
): Promise<SpotWithStatus[]> {
  const spotConditions = [eq(spotsTable.isActive, true)];

  if (resourceType) {
    spotConditions.push(eq(spotsTable.resourceType, resourceType));
  }

  if (entityId) {
    spotConditions.push(
      or(eq(spotsTable.entityId, entityId), isNull(spotsTable.entityId))!
    );
  }

  // Obtener todos los datos en paralelo
  const [spots, reservations, cessions, visitorReservations] =
    await Promise.all([
      db
        .select()
        .from(spotsTable)
        .where(and(...spotConditions))
        .orderBy(spotsTable.label),
      db
        .select({
          id: reservationsTable.id,
          spotId: reservationsTable.spotId,
          userId: reservationsTable.userId,
          fullName: profilesTable.fullName,
        })
        .from(reservationsTable)
        .innerJoin(
          profilesTable,
          eq(reservationsTable.userId, profilesTable.id)
        )
        .where(
          and(
            eq(reservationsTable.date, date),
            eq(reservationsTable.status, "confirmed")
          )
        ),
      db
        .select({
          id: cessionsTable.id,
          spotId: cessionsTable.spotId,
          status: cessionsTable.status,
        })
        .from(cessionsTable)
        .where(
          and(
            eq(cessionsTable.date, date),
            ne(cessionsTable.status, "cancelled")
          )
        ),
      db
        .select({
          id: visitorReservationsTable.id,
          spotId: visitorReservationsTable.spotId,
          visitorName: visitorReservationsTable.visitorName,
        })
        .from(visitorReservationsTable)
        .where(
          and(
            eq(visitorReservationsTable.date, date),
            eq(visitorReservationsTable.status, "confirmed")
          )
        ),
    ]);

  // Construir mapas de búsqueda O(1)
  const reservationBySpot = new Map(reservations.map((r) => [r.spotId, r]));
  const cessionBySpot = new Map(cessions.map((c) => [c.spotId, c]));
  const visitorBySpot = new Map(visitorReservations.map((v) => [v.spotId, v]));

  return spots.map((spot): SpotWithStatus => {
    let status: SpotStatus = "occupied";
    let reservation_id: string | undefined;
    let reserved_by_name: string | undefined;

    const reservation = reservationBySpot.get(spot.id);
    const cession = cessionBySpot.get(spot.id);
    const visitor = visitorBySpot.get(spot.id);

    if (visitor) {
      // La reserva de visitante tiene prioridad
      status = "visitor-blocked";
      reservation_id = visitor.id;
      reserved_by_name = visitor.visitorName;
    } else if (reservation) {
      status = "reserved";
      reservation_id = reservation.id;
      reserved_by_name = reservation.fullName ?? undefined;
    } else if (spot.type === "visitor") {
      // Plazas de visitas (parking) y flexibles (oficina) siempre disponibles
      // salvo reserva activa — no requieren cesión ni dueño.
      status = "free";
    } else if (spot.assignedTo !== null) {
      // Plaza fija con propietario: solo entra en el pool si tiene cesión activa
      if (cession) {
        status = cession.status === "reserved" ? "reserved" : "ceded";
        reservation_id = cession.id;
      } else {
        // Sin cesión activa → bloqueada por su dueño
        status = "occupied";
      }
    } else {
      // Plaza fija sin propietario asignado todavía
      status = resourceType === "office" ? "occupied" : "free";
    }

    return {
      id: spot.id,
      label: spot.label,
      type: spot.type,
      resource_type: spot.resourceType,
      assigned_to: spot.assignedTo,
      position_x: spot.positionX,
      position_y: spot.positionY,
      status,
      reservation_id,
      reserved_by_name,
    };
  });
}
