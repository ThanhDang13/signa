"use client";

import * as React from "react";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";

export interface DataTablePaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface DataTableState {
  pagination: DataTablePaginationState;
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
}

const DEFAULT_STATE: DataTableState = {
  pagination: { pageIndex: 0, pageSize: 10 },
  sorting: [],
  columnFilters: []
};

export function useDataTableState(initial?: Partial<DataTableState>) {
  const [state, setState] = React.useState<DataTableState>({
    pagination: { ...DEFAULT_STATE.pagination, ...initial?.pagination },
    sorting: initial?.sorting ?? DEFAULT_STATE.sorting,
    columnFilters: initial?.columnFilters ?? DEFAULT_STATE.columnFilters
  });

  const onPaginationChange = React.useCallback((pagination: DataTablePaginationState) => {
    setState((prev) => ({ ...prev, pagination }));
  }, []);

  const onSortingChange = React.useCallback((sorting: SortingState) => {
    setState((prev) => ({
      ...prev,
      sorting,
      pagination: { ...prev.pagination, pageIndex: 0 }
    }));
  }, []);

  const onColumnFiltersChange = React.useCallback((columnFilters: ColumnFiltersState) => {
    setState((prev) => ({
      ...prev,
      columnFilters,
      pagination: { ...prev.pagination, pageIndex: 0 }
    }));
  }, []);

  return {
    ...state,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange
  };
}
