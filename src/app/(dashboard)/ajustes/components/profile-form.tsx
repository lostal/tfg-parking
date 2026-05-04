"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile, syncMicrosoftPhoto } from "../actions";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validations";
import type { Profile } from "@/lib/db/types";

interface ProfileFormProps {
  profile: Pick<Profile, "id" | "email" | "fullName" | "avatarUrl" | "role">;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      full_name: profile.fullName || "",
      avatar_url: profile.avatarUrl || "",
    },
  });

  const handleSyncPhoto = async () => {
    setIsSyncing(true);
    const result = await syncMicrosoftPhoto({});
    setIsSyncing(false);
    if (result.success) {
      setValue("avatar_url", result.data.avatarUrl);
      toast.success("Foto sincronizada desde Microsoft 365");
    } else {
      toast.error(result.error);
    }
  };

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsLoading(true);
    const result = await updateProfile(data);
    setIsLoading(false);
    if (!result.success) {
      toast.error(result.error ?? "Error al actualizar el perfil");
    } else {
      toast.success("Perfil actualizado correctamente");
    }
  };

  const initials = (profile.fullName || profile.email)
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Email (readonly) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={profile.email}
          disabled
          className="bg-muted"
        />
        <p className="text-muted-foreground text-xs">
          Tu email corporativo no se puede modificar
        </p>
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Nombre Completo</Label>
        <Input
          id="full_name"
          type="text"
          placeholder="Tu nombre completo"
          {...register("full_name")}
        />
        {errors.full_name && (
          <p className="text-destructive text-sm">{errors.full_name.message}</p>
        )}
      </div>

      {/* Avatar */}
      <div className="space-y-3">
        <Label>Foto de perfil</Label>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {profile.avatarUrl && (
              <AvatarImage
                src={profile.avatarUrl}
                alt={profile.fullName || ""}
              />
            )}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSyncing}
            onClick={handleSyncPhoto}
            className="gap-2"
          >
            <RefreshCw className={isSyncing ? "animate-spin" : ""} size={14} />
            Sincronizar desde Microsoft 365
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Usa el botón para traer tu foto actual de Microsoft 365
        </p>
      </div>

      {/* Role (readonly) */}
      <div className="space-y-2">
        <Label htmlFor="role">Rol</Label>
        <Input
          id="role"
          type="text"
          value={profile.role === "admin" ? "Administrador" : "Empleado"}
          disabled
          className="bg-muted"
        />
        <p className="text-muted-foreground text-xs">
          Tu rol en la organización
        </p>
      </div>

      {/* Submit */}
      <Button type="submit" disabled={!isDirty || isLoading}>
        {isLoading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </form>
  );
}
