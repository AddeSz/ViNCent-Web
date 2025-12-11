import { useKeys } from "@/hooks/useKeys";
import type { FullData } from "@/types/network";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { createDataColumns, createEdgeNodeColumn } from "../Columns";
import TableContent from "../components/TableContent";
import TablePagination from "../components/TablePagination";
import TableTypeToggle from "../components/TableTypeToggle";

interface EdgesTableState {
  columnFilters: any[];
  columnVisibility: Record<string, boolean>;
  columnSizing: Record<string, number>;
  pagination: { pageIndex: number; pageSize: number };
  sorting: any[];
}

interface EdgesTableProps {
  data: FullData[];
  nodeMap: Map<string, FullData>;
  dataType: "nodes" | "edges" | "attributes";
  setDataType: (type: "nodes" | "edges" | "attributes") => void;
  tableCounts: { nodes: number; edges: number; attributes: number };
  tableState: EdgesTableState;
  setTableState: React.Dispatch<React.SetStateAction<EdgesTableState>>;
}

const EdgesTable = ({
  data,
  nodeMap,
  dataType,
  setDataType,
  tableCounts,
  tableState,
  setTableState,
}: EdgesTableProps) => {
  const { enabledEdgeKeys } = useKeys();

  const columns = useMemo(() => {
    const sourceColumn = createEdgeNodeColumn<FullData>(nodeMap, "source");
    const targetColumn = createEdgeNodeColumn<FullData>(nodeMap, "target");
    const dataColumns = createDataColumns<FullData>(enabledEdgeKeys);

    return [
      sourceColumn,
      targetColumn,
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
  }, [enabledEdgeKeys, nodeMap]);

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    onSortingChange: (updater) => {
      setTableState((prev) => ({
        ...prev,
        sorting:
          typeof updater === "function" ? updater(prev.sorting) : updater,
      }));
    },
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
    columnResizeMode: "onChange",
    state: {
      sorting: tableState.sorting,
      columnFilters: tableState.columnFilters,
      columnVisibility: tableState.columnVisibility,
      columnSizing: tableState.columnSizing,
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

export default EdgesTable;
