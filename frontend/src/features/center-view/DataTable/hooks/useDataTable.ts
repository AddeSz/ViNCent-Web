import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnSizingState,
  type PaginationState,
  type SortingState,
  type TableOptions,
  type VisibilityState,
} from "@tanstack/react-table";
import { useCallback } from "react";

export interface BaseTableState {
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  columnSizing: ColumnSizingState;
  pagination: PaginationState;
  scrollPosition: number;
  searchColumn: string;
  searchValue: string;
}

export interface NodesTableState extends BaseTableState {
  visibilityFilter: "all" | "hidden" | "visible" | "selected";
}

export interface EdgesTableState extends BaseTableState {
  sorting: SortingState;
}

export interface AttributesTableState extends BaseTableState {
  sorting: SortingState;
}

type TableState =
  | BaseTableState
  | NodesTableState
  | EdgesTableState
  | AttributesTableState;

interface UseDataTableProps<T, TState extends TableState = TableState> {
  data: T[];
  columns: ColumnDef<T>[];
  state: TState;
  onStateChange: (updates: Partial<TState>) => void;
  additionalOptions?: Partial<TableOptions<T>>;
}

export function useDataTable<
  T extends Record<string, any>,
  TState extends TableState = TableState,
>({
  data,
  columns,
  state,
  onStateChange,
  additionalOptions = {},
}: UseDataTableProps<T, TState>) {
  const createUpdater = useCallback(
    <K extends keyof TState>(key: K) => {
      return (updater: any) => {
        const newValue =
          typeof updater === "function" ? updater(state[key]) : updater;
        onStateChange({ [key]: newValue } as Partial<TState>);
      };
    },
    [state, onStateChange],
  );

  return useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    onSortingChange:
      "sorting" in state ? createUpdater("sorting" as keyof TState) : undefined,
    onColumnFiltersChange: createUpdater("columnFilters"),
    onColumnSizingChange: createUpdater("columnSizing"),
    onColumnVisibilityChange: createUpdater("columnVisibility"),
    onPaginationChange: createUpdater("pagination"),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    columnResizeMode: "onChange",
    state,
    ...additionalOptions,
  });
}
