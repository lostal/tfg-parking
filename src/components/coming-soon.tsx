/**
 * ComingSoon Component
 *
 * Full-height centered placeholder for stub pages.
 * Based on shadcn-admin ComingSoon pattern.
 */

import { Telescope } from "lucide-react";

export function ComingSoon() {
  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <Telescope size={72} />
        <h1 className="text-4xl leading-tight font-bold">Próximamente</h1>
        <p className="text-muted-foreground text-center">
          Esta página está en desarrollo. <br />
          ¡Vuelve pronto!
        </p>
      </div>
    </div>
  );
}
