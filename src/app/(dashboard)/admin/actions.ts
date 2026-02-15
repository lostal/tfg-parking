"use server";

/**
 * Admin Actions
 *
 * Server Actions for admin-only operations:
 * spot CRUD and user role management.
 */

import { actionClient } from "@/lib/actions";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import {
  createSpotSchema,
  updateSpotSchema,
  deleteSpotSchema,
  updateUserRoleSchema,
} from "@/lib/validations";

// ─── Spot CRUD ───────────────────────────────────────────────

/**
 * Create a new parking spot.
 */
export const createSpot = actionClient
  .schema(createSpotSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("spots")
      .insert({
        label: parsedInput.label,
        type: parsedInput.type,
        assigned_to: parsedInput.assigned_to ?? null,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error(
          `Ya existe una plaza con la etiqueta "${parsedInput.label}"`
        );
      }
      throw new Error(`Error al crear plaza: ${error.message}`);
    }

    return { id: data.id };
  });

/**
 * Update an existing parking spot.
 */
export const updateSpot = actionClient
  .schema(updateSpotSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();

    const { id, ...updates } = parsedInput;

    const { error } = await supabase.from("spots").update(updates).eq("id", id);

    if (error) {
      if (error.code === "23505") {
        throw new Error("Ya existe una plaza con esa etiqueta");
      }
      throw new Error(`Error al actualizar plaza: ${error.message}`);
    }

    return { updated: true };
  });

/**
 * Delete a parking spot.
 * Cascade deletes related reservations/cessions (DB constraint).
 */
export const deleteSpot = actionClient
  .schema(deleteSpotSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from("spots")
      .delete()
      .eq("id", parsedInput.id);

    if (error) {
      throw new Error(`Error al eliminar plaza: ${error.message}`);
    }

    return { deleted: true };
  });

// ─── User Role Management ───────────────────────────────────

/**
 * Update a user's role (admin only).
 */
export const updateUserRole = actionClient
  .schema(updateUserRoleSchema)
  .action(async ({ parsedInput }) => {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ role: parsedInput.role })
      .eq("id", parsedInput.user_id);

    if (error) {
      throw new Error(`Error al actualizar rol: ${error.message}`);
    }

    return { updated: true };
  });
