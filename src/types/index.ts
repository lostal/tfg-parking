/**
 * Global Type Definitions
 *
 * Re-exports domain types from the Supabase schema
 * and adds app-specific derived types.
 */

import type { SpotType as SpotTypeEnum } from "@/lib/supabase/types";

// Re-export all DB types as the single source of truth
export type {
  UserRole,
  SpotType,
  ReservationStatus,
  CessionStatus,
  CessionRuleType,
  Profile,
  Spot,
  Reservation,
  Cession,
  VisitorReservation,
  Alert,
  CessionRule,
  SystemConfig,
  Database,
} from "@/lib/supabase/types";

/**
 * Computed spot status for a given date.
 * Derived at query time, not stored in DB.
 */
export type SpotStatus =
  | "free"
  | "occupied"
  | "reserved"
  | "ceded"
  | "visitor-blocked";

/**
 * Spot with its computed status for a specific date.
 * Used by the parking map and calendar views.
 */
export interface SpotWithStatus {
  id: string;
  label: string;
  type: SpotTypeEnum;
  assigned_to: string | null;
  position_x: number | null;
  position_y: number | null;
  status: SpotStatus;
  /** The reservation/cession occupying this spot, if any */
  reservation_id?: string;
  reserved_by_name?: string;
}
