import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

/**
 * Global Not Found Page (404)
 */
export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 p-6 text-center">
        <span className="text-muted-foreground text-6xl font-bold">404</span>
        <h1 className="text-2xl font-bold">Página no encontrada</h1>
        <p className="text-muted-foreground text-sm">
          La página que buscas no existe o ha sido movida.
        </p>
        <Button asChild>
          <Link href={ROUTES.DASHBOARD}>Volver al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
