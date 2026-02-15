/**
 * Server Action Utilities
 *
 * Typed wrapper for all Server Actions providing:
 * - Consistent return type (ActionResult<T>)
 * - Automatic Zod validation
 * - Centralized error handling
 *
 * Usage:
 *   "use server";
 *   import { actionClient } from "@/lib/actions";
 *   import { createReservationSchema } from "@/lib/validations";
 *
 *   export const createReservation = actionClient
 *     .schema(createReservationSchema)
 *     .action(async ({ parsedInput }) => {
 *       // ... your logic
 *       return { id: "123" };
 *     });
 */

import { type ZodType } from "zod/v4";

// ─── Result Types ────────────────────────────────────────────

export type ActionSuccess<T> = {
  success: true;
  data: T;
};

export type ActionError = {
  success: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
};

export type ActionResult<T> = ActionSuccess<T> | ActionError;

// ─── Helper Constructors ────────────────────────────────────

export function success<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}

export function error(
  message: string,
  fieldErrors?: Record<string, string[]>
): ActionError {
  return { success: false, error: message, fieldErrors };
}

// ─── Action Builder ──────────────────────────────────────────

type ActionHandler<TInput, TOutput> = (ctx: {
  parsedInput: TInput;
}) => Promise<TOutput>;

interface ActionBuilder {
  schema: <TInput>(schema: ZodType<TInput>) => {
    action: <TOutput>(
      handler: ActionHandler<TInput, TOutput>
    ) => (input: TInput) => Promise<ActionResult<TOutput>>;
  };
}

/**
 * Creates a type-safe Server Action with Zod validation and error handling.
 *
 * All actions return `ActionResult<T>` — never throw.
 * Validation errors are returned as `fieldErrors`.
 * Unexpected errors are caught and returned as a generic message.
 */
export const actionClient: ActionBuilder = {
  schema<TInput>(schema: ZodType<TInput>) {
    return {
      action<TOutput>(handler: ActionHandler<TInput, TOutput>) {
        return async (input: TInput): Promise<ActionResult<TOutput>> => {
          try {
            // Validate input
            const result = schema.safeParse(input);

            if (!result.success) {
              const fieldErrors: Record<string, string[]> = {};
              for (const issue of result.error.issues) {
                const path = issue.path.join(".");
                if (!fieldErrors[path]) fieldErrors[path] = [];
                fieldErrors[path].push(issue.message);
              }
              return error("Datos inválidos", fieldErrors);
            }

            // Execute handler
            const data = await handler({ parsedInput: result.data });
            return success(data);
          } catch (err) {
            console.error("Action error:", err);
            return error(
              err instanceof Error
                ? err.message
                : "Ha ocurrido un error inesperado"
            );
          }
        };
      },
    };
  },
};
