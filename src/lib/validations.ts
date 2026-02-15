/**
 * Validation Schemas
 *
 * Zod schemas for Server Actions and form validation.
 * Shared between client (form validation) and server (action validation).
 */

import { z } from "zod/v4";

// ─── Reservations ────────────────────────────────────────────

export const createReservationSchema = z.object({
  spot_id: z.string().uuid(),
  date: z.iso.date(),
  notes: z.string().max(500).optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

// ─── Cessions ────────────────────────────────────────────────

export const createCessionSchema = z.object({
  spot_id: z.string().uuid(),
  dates: z.array(z.iso.date()).min(1, "Selecciona al menos un día"),
});

export type CreateCessionInput = z.infer<typeof createCessionSchema>;

// ─── Visitors ────────────────────────────────────────────────

export const createVisitorReservationSchema = z.object({
  spot_id: z.string().uuid(),
  date: z.iso.date(),
  visitor_name: z.string().min(1, "Nombre requerido").max(200),
  visitor_company: z.string().min(1, "Empresa requerida").max(200),
  visitor_email: z.email("Email inválido"),
  notes: z.string().max(500).optional(),
});

export type CreateVisitorReservationInput = z.infer<
  typeof createVisitorReservationSchema
>;

// ─── Alerts ──────────────────────────────────────────────────

export const createAlertSchema = z.object({
  date: z.iso.date(),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;

// ─── Admin: Spots ────────────────────────────────────────────

export const createSpotSchema = z.object({
  label: z.string().min(1, "Etiqueta requerida").max(20),
  type: z.enum(["standard", "management", "visitor", "disabled"]),
  assigned_to: z.string().uuid().optional(),
});

export type CreateSpotInput = z.infer<typeof createSpotSchema>;

export const updateSpotSchema = createSpotSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateSpotInput = z.infer<typeof updateSpotSchema>;

// ─── Cancel Operations ───────────────────────────────────────

export const cancelReservationSchema = z.object({
  id: z.string().uuid(),
});

export type CancelReservationInput = z.infer<typeof cancelReservationSchema>;

export const cancelCessionSchema = z.object({
  id: z.string().uuid(),
});

export type CancelCessionInput = z.infer<typeof cancelCessionSchema>;

export const cancelVisitorReservationSchema = z.object({
  id: z.string().uuid(),
});

export type CancelVisitorReservationInput = z.infer<
  typeof cancelVisitorReservationSchema
>;

// ─── Admin: Spots Delete ─────────────────────────────────────

export const deleteSpotSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteSpotInput = z.infer<typeof deleteSpotSchema>;

// ─── Admin: Users ────────────────────────────────────────────

export const updateUserRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["employee", "management", "admin"]),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
