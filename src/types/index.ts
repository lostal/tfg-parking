/**
 * Global Type Definitions
 *
 * Shared TypeScript types used across the application.
 * Domain-specific types should live close to their feature.
 */

/** User roles in the system */
export type UserRole = "employee" | "management" | "admin";

/** Parking spot status for a given date */
export type SpotStatus =
  | "free"
  | "occupied"
  | "reserved"
  | "ceded"
  | "visitor-blocked";

/** Base entity with audit fields */
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}
