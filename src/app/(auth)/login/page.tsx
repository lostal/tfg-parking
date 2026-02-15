"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants";

/**
 * Login Page - Development Mode
 *
 * Temporary login with email/password for local development.
 * Replace with OAuth when Microsoft Entra ID is configured in production.
 */
export default function LoginPageDev() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const supabase = createClient();
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${ROUTES.CALLBACK}`,
          },
        });
        if (error) throw error;
        alert("Revisa tu email para confirmar la cuenta");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(ROUTES.DASHBOARD);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">GRUPOSIETE Parking</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Modo Desarrollo - Email/Password
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border px-3 py-2"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-md border px-3 py-2"
            placeholder="••••••"
          />
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2 font-medium transition-colors disabled:opacity-50"
        >
          {loading
            ? "Cargando..."
            : mode === "login"
              ? "Iniciar sesión"
              : "Crear cuenta"}
        </button>
      </form>

      <button
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="text-muted-foreground text-sm hover:underline"
      >
        {mode === "login"
          ? "¿No tienes cuenta? Créala"
          : "¿Ya tienes cuenta? Inicia sesión"}
      </button>

      <div className="bg-muted rounded-md p-3 text-xs">
        <strong>DEV MODE:</strong> Cuando configures Microsoft Entra ID,
        renombra este archivo a page.tsx
      </div>
    </div>
  );
}
