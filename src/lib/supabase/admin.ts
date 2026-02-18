/**
 * Supabase Admin Client
 *
 * Uses the service role key to perform privileged operations
 * (e.g. deleting auth users). Only use in Server Actions / Route Handlers.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in your .env.local.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { type Database } from "./types";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
