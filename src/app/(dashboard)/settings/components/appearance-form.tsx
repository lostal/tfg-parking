"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updateAppearance } from "../actions";
import type { ValidatedUserPreferences } from "@/lib/supabase/helpers";
import {
  updateAppearanceSchema,
  type UpdateAppearanceInput,
} from "@/lib/validations";

interface AppearanceFormProps {
  preferences: Pick<ValidatedUserPreferences, "theme" | "locale">;
}

export function AppearanceForm({ preferences }: AppearanceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { setTheme } = useTheme();

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<UpdateAppearanceInput>({
    resolver: zodResolver(updateAppearanceSchema),
    defaultValues: {
      theme: preferences.theme,
      locale: preferences.locale,
    },
  });

  const themeValue = watch("theme");
  const locale = watch("locale");

  const onSubmit = async (data: UpdateAppearanceInput) => {
    try {
      setIsLoading(true);

      // Apply theme immediately
      setTheme(data.theme);

      // Save to database
      await updateAppearance(data);
      toast.success("Apariencia actualizada correctamente");
    } catch (error) {
      toast.error("Error al actualizar la apariencia");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Apariencia</h3>
        <p className="text-muted-foreground text-sm">
          Personaliza el tema y el idioma de la aplicación
        </p>
      </div>
      <div className="border-t" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Theme */}
        <div className="space-y-3">
          <Label>Tema</Label>
          <RadioGroup
            value={themeValue}
            onValueChange={(value) =>
              setValue("theme", value as "light" | "dark" | "system", {
                shouldDirty: true,
              })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="theme-light" />
              <Label htmlFor="theme-light" className="font-normal">
                Claro
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="theme-dark" />
              <Label htmlFor="theme-dark" className="font-normal">
                Oscuro
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="theme-system" />
              <Label htmlFor="theme-system" className="font-normal">
                Sistema (automático)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="border-t" />

        {/* Language */}
        <div className="space-y-3">
          <Label>Idioma</Label>
          <RadioGroup
            value={locale}
            onValueChange={(value) =>
              setValue("locale", value as "es" | "en", { shouldDirty: true })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="es" id="locale-es" />
              <Label htmlFor="locale-es" className="font-normal">
                🇪🇸 Español
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="en" id="locale-en" />
              <Label htmlFor="locale-en" className="font-normal">
                🇬🇧 English
              </Label>
            </div>
          </RadioGroup>
          <p className="text-muted-foreground text-xs">
            La internacionalización completa está en desarrollo
          </p>
        </div>

        {/* Submit */}
        <Button type="submit" disabled={!isDirty || isLoading}>
          {isLoading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </form>
    </div>
  );
}
