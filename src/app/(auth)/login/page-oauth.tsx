"use client";

import { ROUTES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

/**
 * Login Page
 *
 * Redirects to Microsoft Entra ID OAuth via Supabase Auth.
 */
export default function LoginPage() {
  const supabase = createClient();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        scopes: "email profile openid offline_access",
        redirectTo: `${window.location.origin}${ROUTES.CALLBACK}`,
      },
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">GRUPOSIETE Parking</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Inicia sesión con tu cuenta corporativa
        </p>
      </div>
      <button
        onClick={handleLogin}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 w-full items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
      >
        Iniciar sesión con Microsoft
      </button>
    </div>
  );
}
