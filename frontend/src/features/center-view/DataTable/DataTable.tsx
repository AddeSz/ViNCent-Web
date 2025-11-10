import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import type { ContextType } from "@/features/center-view/CenterView";
import { useKeys } from "@/hooks/useKeys";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type { FullData } from "@/types/network";
import {
  createDataColumns,
  createHiddenColumn,
  createLabelColumn,
  createSelectColumn,
} from "./Columns";
import TableContent from "./TableContent";
import TableControls from "./TableControls";
import TablePagination from "./TablePagination";

interface DataTableProps {
  data: FullData[];
  sorting: SortingState;
  onSortingChange: (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => void;
  handleContextMenu: (target: ContextType, data?: any) => void;
}

const DataTable = ({
  data,
  sorting,
  onSortingChange,
  handleContextMenu,
}: DataTableProps) => {
  const selectedNodes = useNetworkStore((s) => s.selectedNodes);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [visibilityFilter, setVisibilityFilter] = useState<
    "all" | "hidden" | "visible" | "selected"
  >("all");

  const { enabledNodeKeys } = useKeys();

  const columns = useMemo(() => {
    const selectColumn = createSelectColumn<(typeof data)[number]>();
    const labelColumn = createLabelColumn<(typeof data)[number]>();
    const hiddenColumn = createHiddenColumn<(typeof data)[number]>();
    const dataColumns =
      createDataColumns<(typeof data)[number]>(enabledNodeKeys);
    return [selectColumn, hiddenColumn, labelColumn, ...dataColumns];
  }, [enabledNodeKeys]);

  const rowSelection = useMemo(() => {
    const selection: Record<string, true> = {};
    selectedNodes.forEach((id) => (selection[id] = true));
    return selection;
  }, [selectedNodes]);

  const handleRowSelectionChange = (updater: any) => {
    const newSelection =
      typeof updater === "function" ? updater(rowSelection) : updater;
    const newSelectedIds = new Set(Object.keys(newSelection));
    useNetworkStore.setState({ selectedNodes: newSelectedIds });
  };

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (row.stable) return false;

      if (visibilityFilter === "hidden") return row.hidden === true;
      if (visibilityFilter === "visible") return !row.hidden;
      if (visibilityFilter === "selected") return selectedNodes.has(row.id);

      return true;
    });
  }, [data, visibilityFilter, selectedNodes]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getRowId: (row) => row.id,
    onSortingChange,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: handleRowSelectionChange,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  return (
    <div
      className="flex h-full w-full flex-col px-3"
      onContextMenu={() => handleContextMenu("data-table")}
    >
      <TableControls table={table} setVisibilityFilter={setVisibilityFilter} />
      <TableContent table={table} columnsLength={columns.length} />
      <TablePagination table={table} rowsPerPageOptions={[10, 25, 50, 100]} />
    </div>
  );
};

export default DataTable;
