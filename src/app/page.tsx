import { redirect } from "next/navigation";
import { ROUTES, getHomeRouteForRole } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth/helpers";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  if (!user.profile?.entityId && user.profile?.role !== "admin") {
    redirect("/onboarding");
  }

  redirect(getHomeRouteForRole(user.profile?.role));
}
