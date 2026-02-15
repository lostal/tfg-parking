/**
 * Supabase Database Types
 *
 * Re-exports from auto-generated types (`pnpm db:types`)
 * with friendly aliases for use across the app.
 *
 * @see database.types.ts  — auto-generated, do NOT edit manually
 * @see supabase/migrations/ — source of truth for the schema
 */

// Re-export the full auto-generated Database type
export type { Database } from "./database.types";

// Re-export helper generics
export type {
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "./database.types";

// ─── Friendly Row Aliases ────────────────────────────────────

import type { Database } from "./database.types";

type PublicTables = Database["public"]["Tables"];
type PublicEnums = Database["public"]["Enums"];

/** Row types (what you get back from a SELECT) */
export type Profile = PublicTables["profiles"]["Row"];
export type Spot = PublicTables["spots"]["Row"];
export type Reservation = PublicTables["reservations"]["Row"];
export type Cession = PublicTables["cessions"]["Row"];
export type VisitorReservation = PublicTables["visitor_reservations"]["Row"];
export type Alert = PublicTables["alerts"]["Row"];
export type CessionRule = PublicTables["cession_rules"]["Row"];
export type SystemConfig = PublicTables["system_config"]["Row"];

/** Enum types */
export type UserRole = PublicEnums["user_role"];
export type SpotType = PublicEnums["spot_type"];
export type ReservationStatus = PublicEnums["reservation_status"];
export type CessionStatus = PublicEnums["cession_status"];
export type CessionRuleType = PublicEnums["cession_rule_type"];
