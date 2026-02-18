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
import type { Spot } from "@/lib/supabase/types";
import {
  updateUserRole,
  assignSpotToUser,
} from "@/app/(dashboard)/admin/actions";
import { useUsers } from "./users-provider";
import type { ProfileWithSpot } from "./types";

// ─── Role configuration ────────────────────────────────────────────────────────

export const roleOptions = [
  { label: "Administrador", value: "admin", icon: Shield },
  { label: "Dirección", value: "management", icon: Building2 },
  { label: "General", value: "employee", icon: Users },
] as const;

// ─── Inline cell components ────────────────────────────────────────────────────

function InlineRoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isAdmin = currentRole === "admin";

  return (
    <Select
      value={currentRole}
      disabled={isAdmin || pending}
      onValueChange={(value) => {
        startTransition(async () => {
          const result = await updateUserRole({
            user_id: userId,
            role: value as "employee" | "management" | "admin",
          });
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success("Rol actualizado");
          router.refresh();
        });
      }}
    >
      <SelectTrigger className="h-8 w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {isAdmin && <SelectItem value="admin">Administrador</SelectItem>}
        <SelectItem value="management">Dirección</SelectItem>
        <SelectItem value="employee">General</SelectItem>
      </SelectContent>
    </Select>
  );
}

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
      <SelectTrigger className="h-8 w-[130px]">
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
      cell: ({ row }) => (
        <InlineRoleSelect
          userId={row.original.id}
          currentRole={row.getValue("role")}
        />
      ),
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
    },
    {
      id: "actions",
      cell: ({ row }) => <UserRowActions row={row} />,
      enableHiding: false,
    },
  ];
}
