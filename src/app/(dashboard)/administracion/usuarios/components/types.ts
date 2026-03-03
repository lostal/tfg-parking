/**
 * Types for the admin users table.
 * Extends the base Profile with independently assigned spots (parking + office).
 */

import type { Profile, Spot } from "@/lib/supabase/types";

/** Profile with independent parking and office spot assignments */
export type ProfileWithSpots = Profile & {
  parking_spot: Spot | null;
  office_spot: Spot | null;
};
