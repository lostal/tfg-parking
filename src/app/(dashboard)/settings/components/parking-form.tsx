"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { updateParkingPreferences } from "../actions";
import type { ValidatedUserPreferences } from "@/lib/supabase/helpers";
import {
  updateParkingPreferencesSchema,
  type UpdateParkingPreferencesInput,
} from "@/lib/validations";

interface ParkingFormProps {
  preferences: Pick<
    ValidatedUserPreferences,
    "default_view" | "favorite_spot_ids" | "usual_arrival_time"
  >;
  availableSpots: Array<{ id: string; label: string }>;
}

export function ParkingForm({ preferences, availableSpots }: ParkingFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateParkingPreferencesInput>({
    resolver: zodResolver(updateParkingPreferencesSchema),
    defaultValues: {
      default_view: preferences.default_view,
      favorite_spot_ids: preferences.favorite_spot_ids,
      usual_arrival_time: preferences.usual_arrival_time || "09:00",
    },
  });

  const defaultView = watch("default_view");
  const favoriteSpotIds = watch("favorite_spot_ids");

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

  const toggleFavoriteSpot = (spotId: string): void => {
    const newFavorites = favoriteSpotIds.includes(spotId)
      ? favoriteSpotIds.filter((id) => id !== spotId)
      : [...favoriteSpotIds, spotId];

    setValue("favorite_spot_ids", newFavorites, { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Preferencias de Parking</h3>
        <p className="text-muted-foreground text-sm">
          Personaliza tu experiencia de uso
        </p>
      </div>
      <div className="border-t" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Default View */}
        <div className="space-y-3">
          <Label>Vista por Defecto</Label>
          <RadioGroup
            value={defaultView}
            onValueChange={(value) =>
              setValue("default_view", value as "map" | "list" | "calendar", {
                shouldDirty: true,
              })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="map" id="view-map" />
              <Label htmlFor="view-map" className="font-normal">
                Mapa Interactivo
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="list" id="view-list" />
              <Label htmlFor="view-list" className="font-normal">
                Lista
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="calendar" id="view-calendar" />
              <Label htmlFor="view-calendar" className="font-normal">
                Calendario
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="border-t" />

        {/* Favorite Spots */}
        <div className="space-y-3">
          <div>
            <Label>Plazas Favoritas</Label>
            <p className="text-muted-foreground mt-1 text-sm">
              Recibirás alertas prioritarias cuando estas plazas se liberen
            </p>
          </div>

          <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto rounded-md border p-3">
            {availableSpots.map((spot) => (
              <Button
                key={spot.id}
                type="button"
                variant={
                  favoriteSpotIds.includes(spot.id) ? "default" : "outline"
                }
                size="sm"
                onClick={() => toggleFavoriteSpot(spot.id)}
                className="h-10"
              >
                {spot.label}
              </Button>
            ))}
          </div>

          {favoriteSpotIds.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No has seleccionado plazas favoritas
            </p>
          )}
          {favoriteSpotIds.length > 0 && (
            <p className="text-muted-foreground text-sm">
              {favoriteSpotIds.length} plaza(s) seleccionada(s)
            </p>
          )}
        </div>

        <div className="border-t" />

        {/* Usual Arrival Time */}
        <div className="space-y-2">
          <Label htmlFor="usual_arrival_time">Hora Habitual de Llegada</Label>
          <Input
            id="usual_arrival_time"
            type="time"
            className="w-40"
            {...register("usual_arrival_time")}
          />
          {errors.usual_arrival_time && (
            <p className="text-destructive text-sm">
              {errors.usual_arrival_time.message}
            </p>
          )}
          <p className="text-muted-foreground text-xs">
            Se usará para estadísticas y sugerencias futuras
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
