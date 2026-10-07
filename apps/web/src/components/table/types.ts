import { ComponentType } from "react";

export {
  dataTableQuerySchema,
  sortingItemSchema,
  columnFilterItemSchema,
  type DataTableQuery,
  type SortingItem,
  type ColumnFilterItem
} from "@signa/web/lib/schemas/data-table-query";

export interface DataTableSearchableColumn {
  id: string;
  title: string;
}

export interface DataTableFilterableOption {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
}

export interface DataTableFilterableColumn {
  id: string;
  title: string;
  options: DataTableFilterableOption[];
}
