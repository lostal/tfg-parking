"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Dashboard Error Boundary
 *
 * Catches errors within the dashboard layout without destroying the shell.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="bg-destructive/10 flex h-14 w-14 items-center justify-center rounded-full">
          <span className="text-xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold">Error inesperado</h2>
        <p className="text-muted-foreground text-sm">
          Algo falló al cargar esta sección. Puedes intentar de nuevo.
        </p>
        {error.digest && (
          <p className="text-muted-foreground font-mono text-xs">
            {error.digest}
          </p>
        )}
        <Button onClick={reset} size="sm">
          Reintentar
        </Button>
      </div>
    </div>
  );
}
