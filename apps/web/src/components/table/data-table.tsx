"use client";

import * as React from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState
} from "@tanstack/react-table";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@signa/react-ui/components/ui/table";
import {
  DataTableFilterableColumn,
  DataTableSearchableColumn
} from "@signa/web/components/table/types";
import { DataTableToolbar } from "@signa/web/components/table/table-toolbar";
import { DataTablePagination } from "@signa/web/components/table/table-pagination";

interface DataTablePaginationState {
  pageIndex: number;
  pageSize: number;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  /** Total page count from the server: Math.ceil(rowCount / pageSize) */
  pageCount: number;
  /** Total row count from the server, used for the "X rows total" label */
  rowCount?: number;
  isLoading?: boolean;

  // --- Controlled, server-driven state ---
  pagination: DataTablePaginationState;
  onPaginationChange: (pagination: DataTablePaginationState) => void;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;

  // --- Optional toolbar configuration ---
  searchableColumns?: DataTableSearchableColumn[];
  filterableColumns?: DataTableFilterableColumn[];
  toolbarActions?: React.ReactNode;

  // --- Optional row selection ---
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selection: RowSelectionState) => void;

  /** Allow more than one sorted column at once (default: single-column sort) */
  enableMultiSort?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  rowCount,
  isLoading = false,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  searchableColumns = [],
  filterableColumns = [],
  toolbarActions,
  enableRowSelection = false,
  onRowSelectionChange,
  enableMultiSort = false
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const table = useReactTable({
    data,
    columns,
    pageCount,
    enableRowSelection,
    enableMultiSort,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    state: {
      pagination,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === "function" ? updater(pagination) : updater;
      onPaginationChange(next);
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange(next);
    },
    onColumnFiltersChange: (updater) => {
      const next = typeof updater === "function" ? updater(columnFilters) : updater;
      onColumnFiltersChange(next);
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(rowSelection) : updater;
      setRowSelection(next);
      onRowSelectionChange?.(next);
    },
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-4">
      <DataTableToolbar
        table={table}
        searchableColumns={searchableColumns}
        filterableColumns={filterableColumns}
      >
        {toolbarActions}
      </DataTableToolbar>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <SkeletonRows columnCount={columns.length} rowCount={pagination.pageSize} />
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} rowCount={rowCount} />
    </div>
  );
}

function SkeletonRows({ columnCount, rowCount }: { columnCount: number; rowCount: number }) {
  return (
    <>
      {Array.from({ length: Math.min(Math.max(rowCount, 1), 10) }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columnCount }).map((_, j) => (
            <TableCell key={j}>
              <div className="bg-muted h-4 w-full animate-pulse rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
