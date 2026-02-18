/**
 * Types for the admin users table.
 * Extends the base Profile with the assigned Spot (for management users).
 */

import type { Profile, Spot } from "@/lib/supabase/types";

export type ProfileWithSpot = Profile & {
  assigned_spot: Spot | null;
};
