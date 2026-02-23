/**
 * useUser Hook
 *
 * Client-side React hook for accessing authentication state.
 * Listens to auth changes and provides user data + profile.
 *
 * Usage:
 *   const { user, profile, loading } = useUser();
 *
 * Para cerrar sesión usar signOutAction() de @/lib/supabase/sign-out
 *
 * @see AuthUser type from lib/supabase/auth.ts
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

interface UseUserReturn {
  user: {
    id: string;
    email: string;
  } | null;
  profile: Profile | null;
  loading: boolean;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Ref estable: createBrowserClient ya es singleton pero evitamos
  // que un cambio de referencia re-dispare el useEffect.
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  // Ref para comparar el userId actual dentro del callback sin closures stale.
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Fetch profile desacoplado del callback de auth.
    // IMPORTANTE: la doc de Supabase advierte que hacer `await` dentro de
    // onAuthStateChange puede causar un deadlock con el lock interno de auth.
    // Por eso el fetch del perfil se hace con .then() fuera del callback.
    const fetchProfile = (userId: string) => {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()
        .then(({ data }) => {
          if (mounted) setProfile(data);
        });
    };

    // Carga inicial: getUser() valida el token con el servidor.
    supabase.auth
      .getUser()
      .then(({ data: { user: authUser } }) => {
        if (!mounted) return;
        if (authUser) {
          currentUserIdRef.current = authUser.id;
          setUser({ id: authUser.id, email: authUser.email ?? "" });
          fetchProfile(authUser.id);
        } else {
          currentUserIdRef.current = null;
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching user:", error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      });

    // Escucha cambios de sesión.
    // El callback es SÍNCRONO — no usar async/await aquí para evitar
    // deadlocks con el lock interno de GoTrue.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      // SIGNED_IN se dispara también al refocalizar una pestaña.
      // Si el usuario no ha cambiado, no hay nada que actualizar.
      if (session?.user?.id === currentUserIdRef.current) return;

      if (session?.user) {
        currentUserIdRef.current = session.user.id;
        setUser({ id: session.user.id, email: session.user.email ?? "" });
        fetchProfile(session.user.id);
      } else {
        currentUserIdRef.current = null;
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // supabase es estable (useRef), no necesita estar en deps

  return {
    user,
    profile,
    loading,
  };
}
