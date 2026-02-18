"use client";

import { useMemo, useState } from "react";
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination, DataTableToolbar } from "@/components/data-table";
import type { Profile, Spot } from "@/lib/supabase/types";
import type { ProfileWithSpot } from "./types";
import { buildUsersColumns, roleOptions } from "./users-columns";

// Stable reference outside component — avoids recreating on every render
function globalFilterFn(
  row: { getValue: (id: string) => unknown; original: ProfileWithSpot },
  _columnId: string,
  filterValue: unknown
) {
  const name = String(row.getValue("full_name") ?? "").toLowerCase();
  const email = String(row.original.email ?? "").toLowerCase();
  const search = String(filterValue).toLowerCase();
  return name.includes(search) || email.includes(search);
}

interface UsersTableProps {
  profiles: Profile[];
  managementSpots: Spot[];
}

export function UsersTable({ profiles, managementSpots }: UsersTableProps) {
  // Local UI-only states
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Stable data — only recalculates when props change, not on every state update
  const data = useMemo<ProfileWithSpot[]>(
    () =>
      profiles.map((p) => ({
        ...p,
        assigned_spot:
          managementSpots.find((s) => s.assigned_to === p.id) ?? null,
      })),
    [profiles, managementSpots]
  );

  // Columns depend on managementSpots — memoize to avoid recreation
  const columns = useMemo(
    () => buildUsersColumns(managementSpots),
    [managementSpots]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-4",
        "max-sm:has-[div[role='toolbar']]:mb-16"
      )}
    >
      <DataTableToolbar
        table={table}
        searchPlaceholder="Buscar por nombre o email..."
        filters={[
          {
            columnId: "role",
            title: "Rol",
            options: roleOptions.map((r) => ({ ...r })),
          },
        ]}
      />
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="group/row">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      "bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted",
                      header.column.columnDef.meta?.className
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="group/row">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted",
                        cell.column.columnDef.meta?.className
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay usuarios.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
