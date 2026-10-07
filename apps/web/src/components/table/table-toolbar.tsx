"use client";

import * as React from "react";
import type { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@signa/react-ui/components/ui/button";
import { Input } from "@signa/react-ui/components/ui/input";
import {
  DataTableFilterableColumn,
  DataTableSearchableColumn
} from "@signa/web/components/table/types";
import { DataTableFacetedFilter } from "@signa/web/components/table/table-faceted-filter";
import { DataTableViewOptions } from "@signa/web/components/table/table-view-option";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchableColumns?: DataTableSearchableColumn[];
  filterableColumns?: DataTableFilterableColumn[];
  children?: React.ReactNode;
}

export function DataTableToolbar<TData>({
  table,
  searchableColumns = [],
  filterableColumns = [],
  children
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {searchableColumns.map((col) => (
          <Input
            key={col.id}
            placeholder={`Filter ${col.title.toLowerCase()}...`}
            value={(table.getColumn(col.id)?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn(col.id)?.setFilterValue(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        ))}

        {filterableColumns.map((col) => {
          const column = table.getColumn(col.id);
          return (
            column && (
              <DataTableFacetedFilter
                key={col.id}
                column={column}
                title={col.title}
                options={col.options}
              />
            )
          );
        })}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {children}
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
