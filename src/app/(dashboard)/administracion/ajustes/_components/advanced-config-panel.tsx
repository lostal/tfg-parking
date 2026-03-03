"use client";

/**
 * Panel de configuración avanzada
 *
 * Muestra todas las claves de system_config en una tabla editable.
 * Para uso técnico/administrativo avanzado.
 */

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SystemConfig } from "@/types";
import { updateAdvancedConfig } from "../actions";

interface AdvancedConfigPanelProps {
  configs: SystemConfig[];
}

function getKeyCategory(key: string): string {
  if (key.startsWith("parking.")) return "parking";
  if (key.startsWith("office.")) return "oficina";
  return "global";
}

function getCategoryVariant(
  category: string
): "default" | "secondary" | "outline" {
  if (category === "parking") return "default";
  if (category === "oficina") return "secondary";
  return "outline";
}

function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return JSON.stringify(value);
  return String(value);
}

function parseValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== "") return num;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed;
  } catch {
    return trimmed;
  }
}

export function AdvancedConfigPanel({ configs }: AdvancedConfigPanelProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (config: SystemConfig) => {
    setEditingKey(config.key);
    setEditValue(formatValue(config.value));
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const handleSave = async () => {
    if (!editingKey) return;
    try {
      setIsSaving(true);
      const parsed = parseValue(editValue);
      const result = await updateAdvancedConfig({
        entries: [
          {
            key: editingKey,
            value: parsed as boolean | number | string | null,
          },
        ],
      });
      if (!result.success) {
        toast.error(result.error ?? "Error al guardar");
        return;
      }
      toast.success(`Clave "${editingKey}" actualizada`);
      setEditingKey(null);
    } catch {
      toast.error("Error inesperado al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Todas las claves están ordenadas alfabéticamente. Para añadir nuevas
        claves, ejecuta una migración SQL con{" "}
        <code className="bg-muted rounded px-1 py-0.5 text-xs">
          INSERT INTO system_config
        </code>
        .
      </p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-50">Clave</TableHead>
              <TableHead className="w-20">Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="w-30">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((config) => {
              const category = getKeyCategory(config.key);
              const isEditing = editingKey === config.key;
              return (
                <TableRow key={config.key}>
                  <TableCell className="font-mono text-sm">
                    {config.key}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getCategoryVariant(category)}>
                      {category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-8 font-mono text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSave();
                          if (e.key === "Escape") handleCancel();
                        }}
                        autoFocus
                      />
                    ) : (
                      <span className="font-mono text-sm">
                        {formatValue(config.value)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={handleSave}
                          disabled={isSaving}
                        >
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancel}
                          disabled={isSaving}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(config)}
                      >
                        Editar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <p className="text-muted-foreground text-xs">
        Los valores se interpretan como JSON. Booleanos: <code>true</code>/
        <code>false</code>. Nulos: <code>null</code>. Arrays:{" "}
        <code>[1,2,3]</code>.
      </p>
    </div>
  );
}
