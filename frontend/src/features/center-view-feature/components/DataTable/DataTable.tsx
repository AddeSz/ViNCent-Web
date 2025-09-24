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
import { useEffect, useMemo, useState } from "react";

import { useNetworkStore } from "@/hooks/useNetworkStore";
import type { CombinedData } from "@/types/network";
import type { ContextType } from "../../CenterView";
import { useKeys } from "../../hooks/useKeys";
import { createDataColumns, createSelectColumn } from "./Columns";
import TableContent from "./TableContent";
import TableControls from "./TableControls";
import TablePagination from "./TablePagination";

type DataTableProps = {
  combinedData: CombinedData[];
  sorting: SortingState;
  onSortingChange: (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => void;
  onContextMenuTarget: (target: ContextType, data?: any) => void;
  onSortedDataChange?: (sortedData: CombinedData[]) => void;
};

const DataTable = ({
  combinedData,
  sorting,
  onSortingChange,
  onContextMenuTarget,
  onSortedDataChange,
}: DataTableProps) => {
  const selectedNodes = useNetworkStore((s) => s.selectedNodes);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });

  const { allKeys } = useKeys();

  const rowsPerPageOptions = useMemo(() => {
    const baseOptions = [10, 25, 50, 100];
    const total = combinedData.length;
    return [...baseOptions.filter((n) => n < total), total];
  }, [combinedData.length]);

  const columns = useMemo(() => {
    const selectColumn = createSelectColumn<(typeof combinedData)[number]>();
    const dataColumns =
      createDataColumns<(typeof combinedData)[number]>(allKeys);
    return [selectColumn, ...dataColumns];
  }, [allKeys]);

  const rowSelection = useMemo(() => {
    const selection: Record<string, true> = {};
    selectedNodes.forEach((id) => (selection[id] = true));
    return selection;
  }, [selectedNodes]);

  const firstColumnKey = allKeys[0] ?? "select";

  const handleRowSelectionChange = (updater: any) => {
    const newSelection =
      typeof updater === "function" ? updater(rowSelection) : updater;
    const newSelectedIds = new Set(Object.keys(newSelection));
    useNetworkStore.setState({ selectedNodes: newSelectedIds });
  };

  const table = useReactTable({
    data: combinedData,
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

  const sortedCombinedData = useMemo(
    () => table.getSortedRowModel().rows.map((row) => row.original),
    [table.getSortedRowModel().rows],
  );

  useEffect(() => {
    if (onSortedDataChange) onSortedDataChange(sortedCombinedData);
  }, [sortedCombinedData]);

  return (
    <div
      className="flex h-full w-full flex-col px-3"
      onContextMenu={() => onContextMenuTarget("data-table")}
    >
      <TableControls table={table} firstColumnKey={firstColumnKey} />

      <TableContent table={table} columnsLength={columns.length} />

      <TablePagination table={table} rowsPerPageOptions={rowsPerPageOptions} />
    </div>
  );
};

export default DataTable;
