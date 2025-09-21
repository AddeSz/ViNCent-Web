import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";

import { useAttributeStore } from "@/hooks/useAttributeStore";
import { useCentralityStore } from "@/hooks/useCentralityStore";
import { useChartSettings } from "@/hooks/useChartSettings";
import { useNetworkStore } from "@/hooks/useNetworkStore";
import type { CombinedData } from "@/types/network";
import {
  createAttributeColumns,
  createCentralityColumns,
  createSelectColumn,
} from "./Columns";
import TableContent from "./TableContent";
import TableControls from "./TableControls";
import TablePagination from "./TablePagination";

//suppress TanStack Table column error
// This error is thrown when I sort one of the columns and then hide it
// or when I swap display mode. It's harmless as tanstack automatically
// defaults to a new value, but the console error is still thrown
// which annoys me ... so I have disabled it.
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString() || "";
  if (
    message.includes("Column with id") &&
    message.includes("does not exist")
  ) {
    return;
  }
  originalConsoleError(...args);
};

type DataTableProps = {
  combinedData: CombinedData[];
  sorting: SortingState;
  onSortingChange: (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => void;
  onSortedDataChange?: (sortedData: CombinedData[]) => void;
};

const DataTable = ({
  combinedData,
  sorting,
  onSortingChange,
  onSortedDataChange,
}: DataTableProps) => {
  const centralityKeys = useCentralityStore((s) => s.centralityKeys);

  const enabledCentralityKeys = useCentralityStore(
    (s) => s.enabledCentralityKeys,
  );
  const attributeKeys = useAttributeStore((s) => s.attributeKeys);
  const enabledAttributeKeys = useAttributeStore((s) => s.enabledAttributeKeys);
  const selectedNodes = useNetworkStore((s) => s.selectedNodes);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });
  const displayMode = useChartSettings((s) => s.displayMode);

  const rowsPerPageOptions = useMemo(() => {
    const baseOptions = [10, 25, 50, 100];
    const total = combinedData.length;

    return [...baseOptions.filter((n) => n < total), total];
  }, [combinedData.length]);

  const columns = useMemo(() => {
    const selectColumn = createSelectColumn<(typeof combinedData)[number]>();

    let centralityColumns: ColumnDef<(typeof combinedData)[number]>[] = [];
    let attributeColumns: ColumnDef<(typeof combinedData)[number]>[] = [];

    if (displayMode === "centrality" || displayMode === "both") {
      centralityColumns = createCentralityColumns<
        (typeof combinedData)[number]
      >(enabledCentralityKeys);
    }
    if (displayMode === "attributes" || displayMode === "both") {
      attributeColumns =
        createAttributeColumns<(typeof combinedData)[number]>(
          enabledAttributeKeys,
        );
    }

    return [selectColumn, ...centralityColumns, ...attributeColumns];
  }, [enabledCentralityKeys, enabledAttributeKeys, displayMode]);

  const rowSelection = useMemo(() => {
    const selection: Record<string, true> = {};
    selectedNodes.forEach((id) => {
      selection[id] = true;
    });
    return selection;
  }, [selectedNodes]);

  const firstColumnKey = useMemo(() => {
    if (displayMode === "centrality") {
      return enabledCentralityKeys[0] ?? "select";
    }
    if (displayMode === "attributes") {
      return enabledAttributeKeys[0] ?? "select";
    }
    return enabledCentralityKeys[0] ?? enabledAttributeKeys[0] ?? "select";
  }, [enabledCentralityKeys, enabledAttributeKeys, displayMode]);

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
    <div className="flex h-full w-full flex-col px-3">
      <TableControls
        table={table}
        firstColumnKey={firstColumnKey}
        centralityKeys={centralityKeys}
        attributeKeys={attributeKeys}
      />

      <TableContent table={table} columnsLength={columns.length} />

      <TablePagination table={table} rowsPerPageOptions={rowsPerPageOptions} />
    </div>
  );
};

export default DataTable;
