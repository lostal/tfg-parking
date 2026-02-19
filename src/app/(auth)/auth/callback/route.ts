/**
 * Auth Callback Route
 *
 * Handles the OAuth redirect from Supabase/Entra ID.
 * Exchanges code for session and redirects to dashboard.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Handle different environments for redirect
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        // Development: use origin from request
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        // Production with proxy: use forwarded host
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        // Fallback: use origin
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Redirect to login on error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
