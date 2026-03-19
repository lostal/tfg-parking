/**
 * Queries de Preferencias
 *
 * Consultas de servidor para preferencias de usuario y estado de la integración con Microsoft
 */

import { db } from "@/lib/db";
import {
  spots as spotsTable,
  cessions as cessionsTable,
  userPreferences as userPreferencesTable,
  userMicrosoftTokens as userMicrosoftTokensTable,
  profiles as profilesTable,
} from "@/lib/db/schema";
import type { Profile } from "@/lib/db/types";
import { toServerDateStr } from "@/lib/utils";
import {
  validateUserPreferences,
  type ValidatedUserPreferences,
} from "@/lib/db/helpers";
import { eq, and, gte, ne, asc } from "drizzle-orm";

// ─── Obtener preferencias de usuario ─────────────────────────

export async function getUserPreferences(
  userId: string
): Promise<ValidatedUserPreferences | null> {
  const rows = await db
    .select()
    .from(userPreferencesTable)
    .where(eq(userPreferencesTable.userId, userId))
    .limit(1);

  const [prefs] = rows;
  if (!prefs) {
    return null;
  }

  return validateUserPreferences(prefs);
}

// ─── Obtener estado de conexión con Microsoft ─────────────────

export type MicrosoftConnectionStatus = {
  connected: boolean;
  scopes: string[];
  lastSync: string | null;
  lastOOOCheck: string | null;
  currentOOOStatus: boolean;
  teamsConnected: boolean;
  outlookConnected: boolean;
};

export async function getMicrosoftConnectionStatus(
  userId: string
): Promise<MicrosoftConnectionStatus | null> {
  const rows = await db
    .select()
    .from(userMicrosoftTokensTable)
    .where(eq(userMicrosoftTokensTable.userId, userId))
    .limit(1);

  const [token] = rows;
  if (!token) {
    // Sin filas = usuario no ha conectado su cuenta de Microsoft
    return {
      connected: false,
      scopes: [],
      lastSync: null,
      lastOOOCheck: null,
      currentOOOStatus: false,
      teamsConnected: false,
      outlookConnected: false,
    };
  }

  // Comprobar si el token ha expirado — guard contra null y fechas malformadas
  const expiry = token.tokenExpiresAt ? new Date(token.tokenExpiresAt) : null;
  const isExpired = !expiry || isNaN(expiry.getTime()) || expiry < new Date();

  return {
    connected: !isExpired,
    scopes: token.scopes || [],
    lastSync: token.lastCalendarSyncAt
      ? token.lastCalendarSyncAt.toISOString()
      : null,
    lastOOOCheck: token.lastOooCheckAt
      ? token.lastOooCheckAt.toISOString()
      : null,
    currentOOOStatus: token.currentOooStatus,
    teamsConnected: !!token.teamsUserId,
    outlookConnected: !!token.outlookCalendarId,
  };
}

// ─── Obtener info de plaza asignada (para usuarios con plaza fija) ──

export type AssignedSpotInfo = {
  spot: {
    id: string;
    label: string;
    type: string;
  } | null;
  statusToday: "occupied" | "ceded" | "reserved" | "unknown";
  nextCession: {
    id: string;
    date: string;
    status: string;
  } | null;
};

export async function getAssignedSpotInfo(
  userId: string,
  resourceType: "parking" | "office" = "parking"
): Promise<AssignedSpotInfo> {
  // Obtener la plaza asignada al usuario para el tipo de recurso solicitado
  const spotRows = await db
    .select({
      id: spotsTable.id,
      label: spotsTable.label,
      type: spotsTable.type,
    })
    .from(spotsTable)
    .where(
      and(
        eq(spotsTable.assignedTo, userId),
        eq(spotsTable.resourceType, resourceType)
      )
    )
    .limit(1);

  const [spot] = spotRows;
  if (!spot) {
    return {
      spot: null,
      statusToday: "unknown",
      nextCession: null,
    };
  }

  const today = toServerDateStr(new Date());

  // Paralelizar: cesión de hoy + próxima cesión futura en una sola ronda
  const [todayCessions, nextCessions] = await Promise.all([
    db
      .select({ id: cessionsTable.id, status: cessionsTable.status })
      .from(cessionsTable)
      .where(
        and(
          eq(cessionsTable.spotId, spot.id),
          eq(cessionsTable.date, today),
          ne(cessionsTable.status, "cancelled")
        )
      )
      .limit(1),
    db
      .select({
        id: cessionsTable.id,
        date: cessionsTable.date,
        status: cessionsTable.status,
      })
      .from(cessionsTable)
      .where(
        and(
          eq(cessionsTable.spotId, spot.id),
          gte(cessionsTable.date, today),
          ne(cessionsTable.status, "cancelled")
        )
      )
      .orderBy(asc(cessionsTable.date))
      .limit(1),
  ]);

  const todayCession = todayCessions[0] ?? null;
  const nextCession = nextCessions[0] ?? null;

  // Determinar el estado
  let statusToday: "occupied" | "ceded" | "reserved" | "unknown" = "occupied";

  if (todayCession) {
    statusToday = todayCession.status === "reserved" ? "reserved" : "ceded";
  }

  return {
    spot: {
      id: spot.id,
      label: spot.label,
      type: spot.type,
    },
    statusToday,
    nextCession: nextCession
      ? {
          id: nextCession.id,
          date: nextCession.date,
          status: nextCession.status,
        }
      : null,
  };
}

// ─── Tipo de retorno del perfil combinado ─────────────────────

export interface UserProfileWithPreferences {
  profile: Profile;
  preferences: ValidatedUserPreferences | null;
  /** null si hubo un error real de DB (distinto de "sin tokens") */
  microsoftStatus: MicrosoftConnectionStatus | null;
  /** Plazas asignadas por tipo de recurso */
  assignedSpots: {
    parking: AssignedSpotInfo | null;
    office: AssignedSpotInfo | null;
  };
}

// ─── Obtener perfil con preferencias (combinado) ──────────────

export async function getUserProfileWithPreferences(
  userId: string
): Promise<UserProfileWithPreferences | null> {
  // Obtener perfil
  const profileRows = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, userId))
    .limit(1);

  const [profile] = profileRows;
  if (!profile) {
    console.error("Error al obtener el perfil:", { userId });
    return null;
  }

  // Obtener preferencias, estado Microsoft y plazas asignadas en paralelo
  const [preferences, microsoftStatus, parkingSpotData, officeSpotData] =
    await Promise.all([
      getUserPreferences(userId),
      getMicrosoftConnectionStatus(userId),
      getAssignedSpotInfo(userId, "parking"),
      getAssignedSpotInfo(userId, "office"),
    ]);

  return {
    profile,
    preferences,
    microsoftStatus,
    assignedSpots: {
      parking: parkingSpotData.spot ? parkingSpotData : null,
      office: officeSpotData.spot ? officeSpotData : null,
    },
  };
}
