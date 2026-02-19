/**
 * Preferences Queries
 *
 * Server-side queries for user preferences and Microsoft integration status
 */

import { createClient } from "@/lib/supabase/server";
import {
  validateUserPreferences,
  type ValidatedUserPreferences,
} from "@/lib/supabase/helpers";

// ─── Get User Preferences ────────────────────────────────────

export async function getUserPreferences(
  userId: string
): Promise<ValidatedUserPreferences | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching user preferences:", error);
    return null;
  }

  return validateUserPreferences(data);
}

// ─── Get Microsoft Connection Status ─────────────────────────

export async function getMicrosoftConnectionStatus(userId: string): Promise<{
  connected: boolean;
  scopes: string[];
  lastSync: string | null;
  lastOOOCheck: string | null;
  currentOOOStatus: boolean;
  teamsConnected: boolean;
  outlookConnected: boolean;
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_microsoft_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // No tokens found = not connected
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

  // Check if token is expired
  const isExpired = new Date(data.token_expires_at) < new Date();

  return {
    connected: !isExpired,
    scopes: data.scopes || [],
    lastSync: data.last_calendar_sync_at,
    lastOOOCheck: data.last_ooo_check_at,
    currentOOOStatus: data.current_ooo_status,
    teamsConnected: !!data.teams_user_id,
    outlookConnected: !!data.outlook_calendar_id,
  };
}

// ─── Get Management Spot Info (for Management Users) ─────────

export async function getManagementSpotInfo(userId: string): Promise<{
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
} | null> {
  const supabase = await createClient();

  // Get the spot assigned to this management user
  const { data: spot, error: spotError } = await supabase
    .from("spots")
    .select("id, label, type")
    .eq("assigned_to", userId)
    .eq("type", "management")
    .single();

  if (spotError || !spot) {
    return {
      spot: null,
      statusToday: "unknown",
      nextCession: null,
    };
  }

  // Get today's date
  const today: string = new Date().toISOString().split("T")[0]!;

  // Check if there's a cession for today
  const { data: todayCession } = await supabase
    .from("cessions")
    .select("id, status")
    .eq("spot_id", spot.id)
    .eq("date", today)
    .neq("status", "cancelled")
    .single();

  // Determine status
  let statusToday: "occupied" | "ceded" | "reserved" | "unknown" = "occupied";

  if (todayCession) {
    statusToday = todayCession.status === "reserved" ? "reserved" : "ceded";
  }

  // Get next upcoming cession
  const { data: nextCession } = await supabase
    .from("cessions")
    .select("id, date, status")
    .eq("spot_id", spot.id)
    .gte("date", today)
    .neq("status", "cancelled")
    .order("date", { ascending: true })
    .limit(1)
    .single();

  return {
    spot: {
      id: spot.id,
      label: spot.label,
      type: spot.type,
    },
    statusToday,
    nextCession: nextCession || null,
  };
}

// ─── Get User Profile with Preferences (Combined) ────────────

export async function getUserProfileWithPreferences(userId: string) {
  const supabase = await createClient();

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", {
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
      hint: profileError.hint,
    });
    return null;
  }

  // Fetch preferences (will be created by trigger if doesn't exist)
  const preferences = await getUserPreferences(userId);

  // Fetch Microsoft connection status
  const microsoftStatus = await getMicrosoftConnectionStatus(userId);

  // If management, fetch spot info
  let managementSpot = null;
  if (profile.role === "management" || profile.role === "admin") {
    managementSpot = await getManagementSpotInfo(userId);
  }

  return {
    profile,
    preferences,
    microsoftStatus,
    managementSpot,
  };
}
