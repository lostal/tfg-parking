"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Calendar, MessageSquare } from "lucide-react";

interface MicrosoftConnectionCardProps {
  status: {
    connected: boolean;
    scopes: string[];
    lastSync: string | null;
    lastOOOCheck: string | null;
    currentOOOStatus: boolean;
    teamsConnected: boolean;
    outlookConnected: boolean;
  } | null;
}

export function MicrosoftConnectionCard({
  status,
}: MicrosoftConnectionCardProps) {
  const connected = status?.connected || false;

  // TODO: Implement OAuth flow when ready
  const handleConnect = () => {
    alert("OAuth de Microsoft aún no implementado (Coming Soon)");
  };

  const handleDisconnect = () => {
    if (
      confirm(
        "¿Estás seguro de que quieres desvincular tu cuenta de Microsoft? Se desactivarán las notificaciones de Teams y la sincronización con Outlook."
      )
    ) {
      // TODO: Call disconnectMicrosoftAccount action
      alert("Función de desvinculación (Coming Soon)");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Conexión con Microsoft 365</CardTitle>
            <CardDescription>
              Integración con Teams y Outlook Calendar
            </CardDescription>
          </div>
          {connected ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Conectado
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <XCircle className="h-3 w-3" />
              No conectado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!connected ? (
          <>
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Conecta tu cuenta de Microsoft 365 para habilitar:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <MessageSquare className="text-primary h-4 w-4" />
                  <span>Notificaciones a través del bot de Teams</span>
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="text-primary h-4 w-4" />
                  <span>Sincronización con Outlook Calendar</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="text-primary h-4 w-4" />
                  <span>
                    Detección automática de &quot;Fuera de Oficina&quot;
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                🚧 Función en desarrollo
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                La integración con Microsoft 365 estará disponible próximamente
              </p>
            </div>

            <Button onClick={handleConnect} disabled>
              Conectar con Microsoft 365
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Microsoft Teams</span>
                  {status?.teamsConnected ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Conectado
                    </Badge>
                  ) : (
                    <Badge variant="secondary">No configurado</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Outlook Calendar
                  </span>
                  {status?.outlookConnected ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Sincronizado
                    </Badge>
                  ) : (
                    <Badge variant="secondary">No configurado</Badge>
                  )}
                </div>
              </div>

              {status?.lastSync && (
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    Última sincronización:
                  </span>{" "}
                  <span>
                    {new Date(status.lastSync).toLocaleString("es-ES", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              )}

              {status?.currentOOOStatus && (
                <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-3">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    🏖️ Fuera de Oficina detectado
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Tu plaza se está cediendo automáticamente
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-medium">Permisos otorgados:</h4>
                <div className="flex flex-wrap gap-2">
                  {status?.scopes.map((scope) => (
                    <Badge key={scope} variant="outline" className="text-xs">
                      {scope}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleConnect}>
                Reconectar
              </Button>
              <Button variant="destructive" onClick={handleDisconnect}>
                Desvincular cuenta
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
