import { ROUTES } from "@/lib/constants";

/**
 * Login Page
 *
 * Redirects to Microsoft Entra ID OAuth via Supabase Auth.
 */
export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">GRUPOSIETE Parking</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Inicia sesión con tu cuenta corporativa
        </p>
      </div>
      <a
        href={ROUTES.CALLBACK}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium"
      >
        Iniciar sesión con Microsoft
      </a>
    </div>
  );
}
