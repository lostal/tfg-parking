/**
 * Global Loading State
 *
 * Shown during route transitions at the root level.
 */
export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="border-muted border-t-primary h-8 w-8 animate-spin rounded-full border-4" />
        <p className="text-muted-foreground text-sm">Cargando...</p>
      </div>
    </div>
  );
}
