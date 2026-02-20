"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updateTheme } from "../actions";
import type { ValidatedUserPreferences } from "@/lib/supabase/helpers";
import { updateThemeSchema, type UpdateThemeInput } from "@/lib/validations";

interface PreferencesFormProps {
  preferences: Pick<ValidatedUserPreferences, "theme">;
}

export function PreferencesForm({ preferences }: PreferencesFormProps) {
  const { theme: currentTheme, setTheme } = useTheme();

  const {
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<UpdateThemeInput>({
    resolver: zodResolver(updateThemeSchema),
    defaultValues: {
      theme: preferences.theme === "system" ? "light" : preferences.theme,
    },
  });

  // Sync form with the actual active theme once next-themes has hydrated.
  // This ensures the form reflects what the user sees if they changed theme
  // via the navbar toggle since the last time they saved preferences.
  useEffect(() => {
    if (currentTheme === "light" || currentTheme === "dark") {
      reset({ theme: currentTheme }, { keepDirty: false });
    }
  }, [currentTheme, reset]);

  const themeValue = useWatch({ control, name: "theme" });

  const onSubmit = async (data: UpdateThemeInput) => {
    try {
      setTheme(data.theme);
      await updateTheme(data);
      toast.success("Preferencias actualizadas correctamente");
    } catch (error) {
      toast.error("Error al actualizar las preferencias");
      console.error(error);
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

      <Button type="submit" disabled={!isDirty || isSubmitting}>
        {isSubmitting ? "Guardando..." : "Actualizar preferencias"}
      </Button>
    </form>
  );
}
