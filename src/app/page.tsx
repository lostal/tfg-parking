import { redirect } from "next/navigation";
import { ROUTES, getHomeRouteForRole } from "@/lib/constants";
import { getCurrentUser } from "@/lib/supabase/auth";

/**
 * Root Page
 *
 * Redirects to the first sidebar page for the authenticated user's role,
 * or to login if not authenticated.
 */
export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  redirect(getHomeRouteForRole(user.profile?.role));
}
