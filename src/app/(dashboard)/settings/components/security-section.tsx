"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SecuritySectionProps {
  user: {
    email: string;
    created_at: string;
  };
}

export function SecuritySection({ user }: SecuritySectionProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Error al cerrar sesión");
      console.error(error);
      setIsSigningOut(false);
    }
  };

  const handleSignOutAll = async () => {
    if (!confirm("¿Cerrar sesión en todos los dispositivos?")) {
      return;
    }

    try {
      setIsSigningOut(true);
      const supabase = createClient();

      // Sign out from all sessions
      await supabase.auth.signOut({ scope: "global" });

      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Error al cerrar todas las sesiones");
      console.error(error);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Cuenta</CardTitle>
          <CardDescription>
            Detalles de tu autenticación y sesión
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Autenticación</p>
              <p className="text-muted-foreground text-sm">
                Microsoft Entra ID
              </p>
            </div>
            <Badge variant="default">Activa</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Email</p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Miembro desde</p>
              <p className="text-muted-foreground text-sm">
                {new Date(user.created_at).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Sesiones Activas</CardTitle>
          <CardDescription>
            Gestiona tus sesiones en diferentes dispositivos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Sesión Actual</p>
                <p className="text-muted-foreground text-xs">
                  Windows · Chrome · Ahora
                </p>
              </div>
              <Badge variant="default">Activa</Badge>
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            No se muestran otras sesiones activas
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? "Cerrando..." : "Cerrar Sesión"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleSignOutAll}
              disabled={isSigningOut}
            >
              Cerrar Todas las Sesiones
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
          <CardDescription>Acciones irreversibles en tu cuenta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Eliminar Cuenta</p>
            <p className="text-muted-foreground text-sm">
              Eliminar permanentemente tu cuenta y todos tus datos (reservas,
              cesiones, alertas). Esta acción no se puede deshacer.
            </p>
          </div>

          <Button
            variant="destructive"
            onClick={() =>
              alert("Función de eliminación de cuenta (pendiente implementar)")
            }
          >
            Eliminar Mi Cuenta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
