"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updatePreferences } from "../actions";
import type { ValidatedUserPreferences } from "@/lib/supabase/helpers";
import {
  updatePreferencesSchema,
  type UpdatePreferencesInput,
} from "@/lib/validations";

interface PreferencesFormProps {
  preferences: Pick<ValidatedUserPreferences, "theme" | "default_view">;
}

export function PreferencesForm({ preferences }: PreferencesFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { setTheme } = useTheme();

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<UpdatePreferencesInput>({
    resolver: zodResolver(updatePreferencesSchema),
    defaultValues: {
      theme: preferences.theme === "system" ? "light" : preferences.theme,
      default_view: preferences.default_view,
    },
  });

  const themeValue = watch("theme");
  const defaultView = watch("default_view");

  const onSubmit = async (data: UpdatePreferencesInput) => {
    try {
      setIsLoading(true);

      // Apply theme immediately
      setTheme(data.theme);

      // Save to database
      await updatePreferences(data);
      toast.success("Preferencias actualizadas correctamente");
    } catch (error) {
      toast.error("Error al actualizar las preferencias");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Theme with Visual Previews */}
      <div className="space-y-3">
        <Label>Tema</Label>
        <p className="text-muted-foreground text-sm">
          Selecciona el tema para el dashboard
        </p>
        <RadioGroup
          value={themeValue}
          onValueChange={(value) =>
            setValue("theme", value as "light" | "dark", {
              shouldDirty: true,
            })
          }
          className="grid max-w-md grid-cols-2 gap-8 pt-2"
        >
          {/* Light Theme Preview */}
          <Label
            htmlFor="theme-light"
            className="[&:has([data-state=checked])>div]:border-primary cursor-pointer"
          >
            <RadioGroupItem
              value="light"
              id="theme-light"
              className="sr-only"
            />
            <div className="border-muted hover:border-accent items-center rounded-md border-2 p-1">
              <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                <div className="space-y-2 rounded-md bg-white p-2 shadow-xs">
                  <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                  <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-xs">
                  <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                  <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-xs">
                  <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                  <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                </div>
              </div>
            </div>
            <span className="block w-full p-2 text-center font-normal">
              Claro
            </span>
          </Label>

          {/* Dark Theme Preview */}
          <Label
            htmlFor="theme-dark"
            className="[&:has([data-state=checked])>div]:border-primary cursor-pointer"
          >
            <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
            <div className="border-muted bg-popover hover:bg-accent hover:text-accent-foreground items-center rounded-md border-2 p-1">
              <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-xs">
                  <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                  <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-xs">
                  <div className="h-4 w-4 rounded-full bg-slate-400" />
                  <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                </div>
                <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-xs">
                  <div className="h-4 w-4 rounded-full bg-slate-400" />
                  <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                </div>
              </div>
            </div>
            <span className="block w-full p-2 text-center font-normal">
              Oscuro
            </span>
          </Label>
        </RadioGroup>
      </div>

      <div className="border-t" />

      {/* Default View */}
      <div className="space-y-3">
        <Label>Vista por Defecto del Parking</Label>
        <p className="text-muted-foreground text-sm">
          Selecciona la vista que se mostrará al abrir la sección de parking
        </p>
        <RadioGroup
          value={defaultView}
          onValueChange={(value) =>
            setValue("default_view", value as "map" | "list" | "calendar", {
              shouldDirty: true,
            })
          }
          className="grid gap-4"
        >
          <Label
            htmlFor="view-map"
            className="border-muted hover:border-accent [&:has([data-state=checked])]:border-primary flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4"
          >
            <RadioGroupItem value="map" id="view-map" />
            <div className="flex-1">
              <div className="font-medium">Mapa Interactivo</div>
              <div className="text-muted-foreground text-sm">
                Visualiza las plazas en un mapa 2D del parking
              </div>
            </div>
          </Label>

          <Label
            htmlFor="view-list"
            className="border-muted hover:border-accent [&:has([data-state=checked])]:border-primary flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4"
          >
            <RadioGroupItem value="list" id="view-list" />
            <div className="flex-1">
              <div className="font-medium">Lista</div>
              <div className="text-muted-foreground text-sm">
                Muestra todas las plazas en formato de lista
              </div>
            </div>
          </Label>

          <Label
            htmlFor="view-calendar"
            className="border-muted hover:border-accent [&:has([data-state=checked])]:border-primary flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4"
          >
            <RadioGroupItem value="calendar" id="view-calendar" />
            <div className="flex-1">
              <div className="font-medium">Calendario</div>
              <div className="text-muted-foreground text-sm">
                Vista de calendario con disponibilidad por día
              </div>
            </div>
          </Label>
        </RadioGroup>
      </div>

      {/* Submit */}
      <Button type="submit" disabled={!isDirty || isLoading}>
        {isLoading ? "Guardando..." : "Actualizar preferencias"}
      </Button>
    </form>
  );
}
