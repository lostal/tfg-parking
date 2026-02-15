/**
 * Next.js Proxy
 *
 * Runs on every matched request to:
 * 1. Refresh Supabase auth tokens
 * 2. Redirect unauthenticated users to /login
 * 3. Redirect authenticated users away from /login
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
