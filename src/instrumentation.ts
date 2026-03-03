/**
 * Next.js Instrumentation Hook
 *
 * Se ejecuta una sola vez al arrancar el servidor (tanto en desarrollo como en producción).
 * Valida las variables de entorno en el momento de inicio para que los errores de
 * configuración fallen rápido y con mensajes claros en lugar de producir errores
 * oscuros en runtime.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Solo en el servidor (Node.js runtime), nunca en el edge o en el cliente
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}
