import { useState, useMemo } from "react";
import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table";

import { useCentralityStore } from "@/hooks/useCentralityStore";
import {
  createSelectColumn,
  createCentralityColumns,
  createAttributeColumns,
} from "./Columns";
import { TableControls } from "./TableControls";
import { TableContent } from "./TableContent";
import { TablePagination } from "./TablePagination";
import { useNetworkStore } from "@/hooks/useNetworkStore";
import useCombinedData from "@/features/center-view-feature/hooks/useCombinedData";
import { useAttributeStore } from "@/hooks/useAttributeStore";

export function DataTable() {
  const combinedDataMap = useCombinedData();
  const combinedData = useMemo(
    () => Array.from(combinedDataMap.values()),
    [combinedDataMap],
  );

  const enabledCentralityKeys = useCentralityStore(
    (s) => s.enabledCentralityKeys,
  );
  const enabledAttributeKeys = useAttributeStore((s) => s.enabledAttributeKeys);
  const selectedNodes = useNetworkStore((s) => s.selectedNodes);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: Math.max(1, Math.ceil(combinedData.length * 0.2)),
  });

  const columns = useMemo(() => {
    const selectColumn = createSelectColumn<(typeof combinedData)[number]>();

    const centralityColumns = createCentralityColumns<
      (typeof combinedData)[number]
    >(enabledCentralityKeys);
    const attributeColumns =
      createAttributeColumns<(typeof combinedData)[number]>(
        enabledAttributeKeys,
      );

    return [selectColumn, ...centralityColumns, ...attributeColumns];
  }, [enabledCentralityKeys, enabledAttributeKeys]);

  const rowSelection = useMemo(() => {
    const selection: Record<string, true> = {};
    selectedNodes.forEach((id) => {
      selection[id] = true;
    });
    return selection;
  }, [selectedNodes]);

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
    onSortingChange: setSorting,
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

  const rowsPerPageOptions = useMemo(() => {
    const percentages = [0.2, 0.4, 0.6, 0.8, 1];
    return percentages.map((p) =>
      Math.max(1, Math.ceil(combinedData.length * p)),
    );
  }, [combinedData.length]);

  return (
    <div className="flex h-full w-full flex-col px-3">
      <TableControls table={table} firstColumnKey={enabledCentralityKeys[0]} />

      <TableContent table={table} columnsLength={columns.length} />

      <TablePagination table={table} rowsPerPageOptions={rowsPerPageOptions} />
    </div>
  );
}
