"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { Building2, MoreHorizontal, Shield, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTableColumnHeader } from "@/components/data-table";
import { LongText } from "@/components/long-text";
import { cn } from "@/lib/utils";
import type { Spot } from "@/lib/supabase/types";
import { assignSpotToUser } from "@/app/(dashboard)/administracion/actions";
import { useUsers } from "./users-provider";
import type { ProfileWithSpot } from "./types";

// ─── Role configuration ────────────────────────────────────────────────────────

export const roleOptions = [
  { label: "Administrador", value: "admin", icon: Shield },
  { label: "Dirección", value: "management", icon: Building2 },
  { label: "General", value: "employee", icon: Users },
] as const;

// ─── Role badge ───────────────────────────────────────────────────────────────

const roleBadgeColors: Record<string, string> = {
  admin:
    "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
  management:
    "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  employee:
    "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800/40 dark:text-zinc-300 dark:border-zinc-600",
};

function RoleBadge({ role }: { role: string }) {
  const option = roleOptions.find((o) => o.value === role);
  const Icon = option?.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
        roleBadgeColors[role] ?? roleBadgeColors.employee
      )}
    >
      {Icon && <Icon className="size-3" />}
      {option?.label ?? role}
    </span>
  );
}

// ─── Inline cell components ────────────────────────────────────────────────────

const SPOT_NONE = "__none__";

function InlineSpotSelect({
  userId,
  currentSpotId,
  managementSpots,
}: {
  userId: string;
  currentSpotId: string | null;
  managementSpots: Spot[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const available = managementSpots.filter(
    (s) => !s.assigned_to || s.assigned_to === userId
  );

  return (
    <Select
      value={currentSpotId ?? SPOT_NONE}
      disabled={pending}
      onValueChange={(value) => {
        const spotId = value === SPOT_NONE ? null : value;
        startTransition(async () => {
          const result = await assignSpotToUser({
            user_id: userId,
            spot_id: spotId,
          });
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success(spotId ? "Plaza asignada" : "Plaza desasignada");
          router.refresh();
        });
      }}
    >
      <SelectTrigger className="h-8 w-32.5">
        <SelectValue placeholder="Sin plaza" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={SPOT_NONE}>Sin plaza</SelectItem>
        {available.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            Plaza {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function UserRowActions({ row }: { row: { original: ProfileWithSpot } }) {
  const { setOpen, setCurrentRow } = useUsers();
  const profile = row.original;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => {
            setCurrentRow({
              id: profile.id,
              full_name: profile.full_name,
              email: profile.email ?? "",
              role: profile.role,
            });
            setOpen("delete");
          }}
        >
          <Trash2 className="text-destructive mr-2 h-4 w-4" />
          Eliminar cuenta
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Column factory ────────────────────────────────────────────────────────────

export function buildUsersColumns(
  managementSpots: Spot[]
): ColumnDef<ProfileWithSpot>[] {
  return [
    {
      id: "full_name",
      accessorFn: (row) => row.full_name ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nombre" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <LongText className="max-w-48 font-medium">
            {row.original.full_name || "—"}
          </LongText>
          <span className="text-muted-foreground truncate text-xs">
            {row.original.email}
          </span>
        </div>
      ),
      meta: { className: "min-w-[180px]" },
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }) => <RoleBadge role={row.getValue("role")} />,
      filterFn: (row, _id, value: string[]) =>
        value.length === 0 || value.includes(row.getValue("role")),
      enableSorting: false,
    },
    {
      id: "assigned_spot",
      header: "Plaza asignada",
      cell: ({ row }) => {
        if (row.original.role !== "management") return null;
        return (
          <InlineSpotSelect
            userId={row.original.id}
            currentSpotId={row.original.assigned_spot?.id ?? null}
            managementSpots={managementSpots}
          />
        );
      },
      enableSorting: false,
      meta: { className: "hidden @xl/content:table-cell" },
    },
    {
      id: "actions",
      cell: ({ row }) => <UserRowActions row={row} />,
      enableHiding: false,
    },
  ];
}
