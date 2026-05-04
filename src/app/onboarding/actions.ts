"use server";

import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { actionClient } from "@/lib/actions";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/helpers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/constants";

const onboardingSchema = z.object({
  entityId: z.string().uuid("Selecciona una sede"),
  phone: z.string().optional(),
  hasFixedParking: z.boolean().optional(),
  hasFixedOffice: z.boolean().optional(),
});

export const completeOnboarding = actionClient
  .schema(onboardingSchema)
  .action(async ({ parsedInput }) => {
    const user = await requireAuth();

    await db
      .update(profiles)
      .set({
        entityId: parsedInput.entityId,
        phone: parsedInput.phone || null,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    revalidatePath("/", "layout");
    redirect(
      user.profile?.role === "admin" ? ROUTES.DASHBOARD : ROUTES.PARKING
    );
  });
