"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Global Error Boundary
 *
 * Catches unhandled errors in the app and shows a recovery UI.
 * Must be a Client Component.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <html lang="es">
      <body className="bg-background text-foreground flex min-h-svh items-center justify-center">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-6 text-center">
          <div className="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold">Algo salió mal</h1>
          <p className="text-muted-foreground text-sm">
            Ha ocurrido un error inesperado. Puedes intentar recargar la página.
          </p>
          {error.digest && (
            <p className="text-muted-foreground font-mono text-xs">
              Código: {error.digest}
            </p>
          )}
          <Button onClick={reset} variant="default">
            Intentar de nuevo
          </Button>
        </div>
      </body>
    </html>
  );
}
