"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updateParkingPreferences } from "../actions";
import type { ValidatedUserPreferences } from "@/lib/supabase/helpers";
import {
  updateParkingPreferencesSchema,
  type UpdateParkingPreferencesInput,
} from "@/lib/validations";

interface ParkingFormProps {
  preferences: Pick<ValidatedUserPreferences, "default_view">;
}

export function ParkingForm({ preferences }: ParkingFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<UpdateParkingPreferencesInput>({
    resolver: zodResolver(updateParkingPreferencesSchema),
    defaultValues: {
      default_view: preferences.default_view,
    },
  });

  const defaultView = watch("default_view");

  const onSubmit = async (data: UpdateParkingPreferencesInput) => {
    try {
      setIsLoading(true);
      await updateParkingPreferences(data);
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
      {/* Default View */}
      <div className="space-y-3">
        <Label>Vista por Defecto</Label>
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
