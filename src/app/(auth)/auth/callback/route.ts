/**
 * Auth Callback Route
 *
 * Handles the OAuth redirect from Supabase/Entra ID.
 * Exchanges code for session and redirects to dashboard.
 */

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Will be used: const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    // TODO: Exchange code for session via Supabase Auth
    // const supabase = await createClient();
    // const { error } = await supabase.auth.exchangeCodeForSession(code);
    // if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Redirect to login on error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
