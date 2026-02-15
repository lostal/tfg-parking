import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

/**
 * Root Page
 *
 * Redirects to dashboard (if authenticated) or login.
 * This is a server component — redirect happens at request time.
 */
export default function HomePage() {
  // TODO: Check auth state and redirect accordingly
  // For now, redirect to dashboard
  redirect(ROUTES.DASHBOARD);
}
