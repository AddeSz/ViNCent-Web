import { useKeys } from "@/hooks/useKeys";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type { FullData } from "@/types/network";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo } from "react";
import {
  createDataColumns,
  createHiddenColumn,
  createLabelColumn,
  createSelectColumn,
} from "../Columns";
import TableContent from "../components/TableContent";
import TablePagination from "../components/TablePagination";
import TableTypeToggle from "../components/TableTypeToggle";

interface NodesTableState {
  columnFilters: any[];
  columnVisibility: Record<string, boolean>;
  columnSizing: Record<string, number>;
  pagination: { pageIndex: number; pageSize: number };
  visibilityFilter: "all" | "hidden" | "visible" | "selected";
}

interface NodesTableProps {
  data: FullData[];
  sorting: SortingState;
  onSortingChange: (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => void;
  dataType: "nodes" | "edges" | "attributes";
  setDataType: (type: "nodes" | "edges" | "attributes") => void;
  tableCounts: { nodes: number; edges: number; attributes: number };
  tableState: NodesTableState;
  setTableState: React.Dispatch<React.SetStateAction<NodesTableState>>;
}

const NodesTable = ({
  data,
  sorting,
  onSortingChange,
  dataType,
  setDataType,
  tableCounts,
  tableState,
  setTableState,
}: NodesTableProps) => {
  const selectedNodes = useNetworkStore((s) => s.selectedNodes);
  const { enabledNodeKeys, enabledNodeCommunityKeys } = useKeys();

  const columns = useMemo(() => {
    const selectColumn = createSelectColumn<FullData>();
    const hiddenColumn = createHiddenColumn<FullData>();
    const labelColumn = createLabelColumn<FullData>();
    const dataColumns = createDataColumns<FullData>([
      ...enabledNodeKeys,
      ...enabledNodeCommunityKeys,
    ]);

    return [
      selectColumn,
      hiddenColumn,
      labelColumn,
      ...dataColumns,
      {
        id: "filler",
        header: () => null,
        cell: () => null,
        size: 0,
        minSize: 0,
        maxSize: Number.MAX_SAFE_INTEGER,
        enableResizing: false,
        enableSorting: false,
        enableColumnFilter: false,
        enableGlobalFilter: false,
      },
    ];
  }, [enabledNodeKeys, enabledNodeCommunityKeys]);

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
      if (row.removed) return false;

      if (tableState.visibilityFilter === "hidden") return row.hidden === true;
      if (tableState.visibilityFilter === "visible") return !row.hidden;
      if (tableState.visibilityFilter === "selected")
        return selectedNodes.has(row.id);

      return true;
    });
  }, [data, tableState.visibilityFilter, selectedNodes]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getRowId: (row) => row.id,
    manualPagination: false,
    autoResetPageIndex: false,
    onSortingChange,
    onColumnFiltersChange: (updater) => {
      setTableState((prev) => ({
        ...prev,
        columnFilters:
          typeof updater === "function" ? updater(prev.columnFilters) : updater,
      }));
    },
    onColumnSizingChange: (updater) => {
      setTableState((prev) => ({
        ...prev,
        columnSizing:
          typeof updater === "function" ? updater(prev.columnSizing) : updater,
      }));
    },
    onColumnVisibilityChange: (updater) => {
      setTableState((prev) => ({
        ...prev,
        columnVisibility:
          typeof updater === "function"
            ? updater(prev.columnVisibility)
            : updater,
      }));
    },
    onPaginationChange: (updater) => {
      setTableState((prev) => ({
        ...prev,
        pagination:
          typeof updater === "function" ? updater(prev.pagination) : updater,
      }));
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: handleRowSelectionChange,
    columnResizeMode: "onChange",
    state: {
      sorting,
      columnFilters: tableState.columnFilters,
      columnVisibility: tableState.columnVisibility,
      columnSizing: tableState.columnSizing,
      rowSelection,
      pagination: tableState.pagination,
    },
  });

  return (
    <>
      <TableTypeToggle
        dataType={dataType}
        setDataType={setDataType}
        tableCounts={tableCounts}
      />
      <TableContent table={table} columnsLength={columns.length} />
      <TablePagination table={table} rowsPerPageOptions={[10, 25, 50, 100]} />
    </>
  );
};

export default NodesTable;
