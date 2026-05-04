"use server";

/**
 * Server Actions de Ajustes
 *
 * Acciones para actualizar el perfil, preferencias e integración con Microsoft.
 * Todas usan el patrón actionClient → devuelven ActionResult<T>, nunca lanzan.
 */

import { z } from "zod/v4";

const DEFAULT_OUTLOOK_CALENDAR_NAME = "Reservas";
import { actionClient } from "@/lib/actions";
import { db } from "@/lib/db";
import {
  profiles,
  userPreferences,
  userMicrosoftTokens,
  users,
} from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/helpers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import {
  updateProfileSchema,
  updateNotificationPreferencesSchema,
  updateOutlookPreferencesSchema,
  updateCessionRulesSchema,
  updateThemeSchema,
} from "@/lib/validations";

// ─── Update Profile ──────────────────────────────────────────

export const updateProfile = actionClient
  .schema(updateProfileSchema)
  .action(async ({ parsedInput }) => {
    const user = await requireAuth();

    const updates: Partial<typeof profiles.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (parsedInput.full_name !== undefined)
      updates.fullName = parsedInput.full_name;
    if (parsedInput.avatar_url !== undefined)
      updates.avatarUrl = parsedInput.avatar_url;

    await db.update(profiles).set(updates).where(eq(profiles.id, user.id));

    revalidatePath("/ajustes");
    return { updated: true };
  });

// ─── Update Notification Preferences ─────────────────────────

export const updateNotificationPreferences = actionClient
  .schema(updateNotificationPreferencesSchema)
  .action(async ({ parsedInput }) => {
    const user = await requireAuth();

    await db
      .update(userPreferences)
      .set({
        notificationChannel: parsedInput.notification_channel,
        notifyReservationConfirmed: parsedInput.notify_reservation_confirmed,
        notifyReservationReminder: parsedInput.notify_reservation_reminder,
        notifyCessionReserved: parsedInput.notify_cession_reserved,
        notifyAlertTriggered: parsedInput.notify_alert_triggered,
        notifyVisitorConfirmed: parsedInput.notify_visitor_confirmed,
        notifyDailyDigest: parsedInput.notify_daily_digest,
        dailyDigestTime: parsedInput.daily_digest_time || null,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, user.id));

    revalidatePath("/ajustes");
    return { updated: true };
  });

// ─── Update Outlook Preferences ──────────────────────────────

export const updateOutlookPreferences = actionClient
  .schema(updateOutlookPreferencesSchema)
  .action(async ({ parsedInput }) => {
    const user = await requireAuth();

    await db
      .update(userPreferences)
      .set({
        outlookCreateEvents: parsedInput.outlook_create_events,
        outlookCalendarName:
          parsedInput.outlook_calendar_name || DEFAULT_OUTLOOK_CALENDAR_NAME,
        outlookSyncEnabled: parsedInput.outlook_sync_enabled,
        outlookSyncInterval: parsedInput.outlook_sync_interval ?? 15,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, user.id));

    revalidatePath("/ajustes");
    return { updated: true };
  });

// ─── Update Auto-Cession Rules ───────────────────────────────

export const updateCessionRules = actionClient
  .schema(updateCessionRulesSchema)
  .action(async ({ parsedInput }) => {
    const user = await requireAuth();

    await db
      .update(userPreferences)
      .set({
        autoCedeOnOoo: parsedInput.auto_cede_on_ooo,
        autoCedeNotify: parsedInput.auto_cede_notify,
        autoCedeDays: parsedInput.auto_cede_days,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, user.id));

    revalidatePath("/ajustes");
    return { updated: true };
  });

// ─── Disconnect Microsoft Account ────────────────────────────

export const disconnectMicrosoftAccount = actionClient
  .schema(z.object({}))
  .action(async () => {
    const user = await requireAuth();

    await db
      .delete(userMicrosoftTokens)
      .where(eq(userMicrosoftTokens.userId, user.id));

    revalidatePath("/ajustes");
    return { disconnected: true };
  });

// ─── Sync Microsoft Photo ─────────────────────────────────

export const syncMicrosoftPhoto = actionClient
  .schema(z.object({}))
  .action(async () => {
    const user = await requireAuth();

    const [token] = await db
      .select({ accessToken: userMicrosoftTokens.accessToken })
      .from(userMicrosoftTokens)
      .where(eq(userMicrosoftTokens.userId, user.id))
      .limit(1);

    if (!token) {
      throw new Error(
        "No hay tokens de Microsoft. Conecta tu cuenta en Ajustes > Microsoft."
      );
    }

    const response = await fetch(
      "https://graph.microsoft.com/v1.0/me/photo/$value",
      { headers: { Authorization: `Bearer ${token.accessToken}` } }
    );

    if (!response.ok) {
      throw new Error(
        "No se pudo obtener la foto de Microsoft 365. Asegúrate de tener una foto configurada."
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const dataUrl = `data:${contentType};base64,${base64}`;

    await db
      .update(profiles)
      .set({ avatarUrl: dataUrl, updatedAt: new Date() })
      .where(eq(profiles.id, user.id));

    revalidatePath("/ajustes");
    return { avatarUrl: dataUrl };
  });

// ─── Test Teams Notification ──────────────────────────────

export const testTeamsNotification = actionClient
  .schema(z.object({}))
  .action(async () => {
    const user = await requireAuth();

    const [token] = await db
      .select({ accessToken: userMicrosoftTokens.accessToken })
      .from(userMicrosoftTokens)
      .where(eq(userMicrosoftTokens.userId, user.id))
      .limit(1);

    if (!token) {
      throw new Error(
        "No hay tokens de Microsoft. Conecta tu cuenta en Ajustes > Microsoft."
      );
    }

    // Enviar notificación de prueba vía Microsoft Graph
    const response = await fetch("https://graph.microsoft.com/v1.0/me/chats", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatType: "oneOnOne",
        members: [
          {
            "@odata.type": "#microsoft.graph.aadUserConversationMember",
            roles: ["owner"],
            "user@odata.bind": "https://graph.microsoft.com/v1.0/me",
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(
        "Error al enviar notificación de Teams. Asegúrate de tener los permisos necesarios."
      );
    }

    return { sent: true };
  });

// ─── Force Calendar Sync ─────────────────────────────────

export const forceCalendarSync = actionClient
  .schema(z.object({}))
  .action(async () => {
    const user = await requireAuth();

    const [token] = await db
      .select({
        accessToken: userMicrosoftTokens.accessToken,
        outlookCalendarId: userMicrosoftTokens.outlookCalendarId,
      })
      .from(userMicrosoftTokens)
      .where(eq(userMicrosoftTokens.userId, user.id))
      .limit(1);

    if (!token) {
      throw new Error(
        "No hay tokens de Microsoft. Conecta tu cuenta en Ajustes > Microsoft."
      );
    }

    // Obtener eventos del calendario de Outlook
    const startDate = new Date().toISOString();
    const endDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${startDate}&endDateTime=${endDate}`,
      {
        headers: { Authorization: `Bearer ${token.accessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error(
        "Error al sincronizar calendario. Verifica los permisos de Outlook."
      );
    }

    // Actualizar última sincronización
    await db
      .update(userMicrosoftTokens)
      .set({
        lastCalendarSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userMicrosoftTokens.userId, user.id));

    revalidatePath("/ajustes");
    return { synced: true };
  });

// ─── Update Theme ─────────────────────────────────────────────

export const updateTheme = actionClient
  .schema(updateThemeSchema)
  .action(async ({ parsedInput }) => {
    const user = await requireAuth();

    await db
      .update(userPreferences)
      .set({
        theme: parsedInput.theme,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, user.id));

    revalidatePath("/ajustes");
    return { updated: true };
  });

// ─── Delete Own Account ───────────────────────────────────────

export const deleteSelfAccount = actionClient
  .schema(z.object({}))
  .action(async () => {
    const user = await requireAuth();

    // Delete the user record — cascade will remove profile and all related data
    const deleted = await db
      .delete(users)
      .where(eq(users.id, user.id))
      .returning({ id: users.id });

    if (!deleted || deleted.length === 0) {
      throw new Error("Error al eliminar la cuenta: usuario no encontrado");
    }

    return { deleted: true };
  });
