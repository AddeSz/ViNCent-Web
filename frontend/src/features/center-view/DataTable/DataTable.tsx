import type { ContextType } from "@/features/center-view/CenterView";
import { useKeys } from "@/hooks/useKeys";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type { FullData } from "@/types/network";
import { formatValue } from "@/utils/utils";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useMemo } from "react";
import {
  createAttributeColumns,
  createDataColumns,
  createEdgeColumn,
  createEdgeSelectColumn,
  createHiddenColumn,
  createLabelColumn,
  createSelectColumn,
  type AttributeRow,
} from "./Columns";
import { BaseTable } from "./components/BaseTable";
import TableSearch from "./components/TableSearch";
import TableTypeToggle from "./components/TableTypeToggle";
import { useDataTable } from "./hooks/useDataTable";
import { useTableStates } from "./hooks/useTableStates";

export type TableType = "nodes" | "edges" | "attributes";

interface DataTableProps {
  sortedNodes: FullData[];
  edgeData: Map<string, FullData>;
  nodeData: Map<string, FullData>;
  sortingState: SortingState;
  onSortingChange: (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => void;
  handleContextMenu: (target: ContextType, data?: any) => void;
  tableStatesManager: ReturnType<typeof useTableStates>;
}

const DataTable = ({
  sortedNodes,
  edgeData,
  nodeData,
  sortingState,
  onSortingChange,
  handleContextMenu,
  tableStatesManager,
}: DataTableProps) => {
  const metricsInfo = useMetricsStore((s) => s.currentMetricsInfo);
  const selectedNodes = useNetworkStore((s) => s.selectedNodes);
  const { enabledNodeKeys, enabledNodeCommunityKeys, enabledEdgeKeys } =
    useKeys();

  const { tableStates, updateTableState, activeTableType, setActiveTableType } =
    tableStatesManager;

  const edgeDataArray = useMemo(
    () => Array.from(edgeData.values()),
    [edgeData],
  );

  const nodeDataArray = useMemo(
    () => Array.from(nodeData.values()).filter((node) => !node.removed),
    [nodeData],
  );

  const attributesData = useMemo<AttributeRow[]>(
    () =>
      Array.from(metricsInfo.entries()).map(([key, info]) => ({
        ...info,
        id: key,
        rangeLabel: info.range
          ? `${formatValue(info.range.min)} - ${formatValue(info.range.max)}`
          : "N/A",
        minValue: info.range?.min ?? null,
        maxValue: info.range?.max ?? null,
        uniqueValues: info.values.size,
      })),
    [metricsInfo],
  );

  const nodesColumns = useMemo(() => {
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

  const edgesColumns = useMemo(() => {
    const selectColumn = createEdgeSelectColumn<FullData>();
    const sourceColumn = createEdgeColumn<FullData>(nodeData, "source");
    const targetColumn = createEdgeColumn<FullData>(nodeData, "target");
    const dataColumns = createDataColumns<FullData>(enabledEdgeKeys);
    return [
      selectColumn,
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
  }, [enabledEdgeKeys, nodeData]);

  const attributesColumns = useMemo(() => {
    const baseColumns = createAttributeColumns();
    return [
      ...baseColumns,
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
    ] as ColumnDef<AttributeRow>[];
  }, []);

  const filteredNodesData = useMemo(() => {
    return sortedNodes.filter((row) => {
      if (row.removed) return false;

      const visFilter = tableStates.nodes.visibilityFilter;
      if (visFilter === "hidden") return row.hidden === true;
      if (visFilter === "visible") return !row.hidden;
      if (visFilter === "selected") return selectedNodes.has(row.id);

      return true;
    });
  }, [sortedNodes, tableStates.nodes.visibilityFilter, selectedNodes]);

  const nodeRowSelection = useMemo(() => {
    const selection: Record<string, true> = {};
    selectedNodes.forEach((id) => (selection[id] = true));
    return selection;
  }, [selectedNodes]);

  const edgeRowSelection = useMemo(() => {
    const selection: Record<string, true> = {};
    edgeDataArray.forEach((edge) => {
      const [source, target] = edge.id.split("|");
      if (selectedNodes.has(source) || selectedNodes.has(target)) {
        selection[edge.id] = true;
      }
    });
    return selection;
  }, [selectedNodes]);

  const handleRowSelectionChange = (updater: any) => {
    const newSelection =
      typeof updater === "function" ? updater(nodeRowSelection) : updater;
    const newSelectedIds = new Set(Object.keys(newSelection));
    useNetworkStore.setState({ selectedNodes: newSelectedIds });
  };

  const nodesTable = useDataTable({
    data: filteredNodesData,
    columns: nodesColumns,
    state: { ...tableStates.nodes, sorting: sortingState },
    onStateChange: (updates) => updateTableState("nodes", updates),
    additionalOptions: {
      onSortingChange,
      onRowSelectionChange: handleRowSelectionChange,
      state: {
        ...tableStates.nodes,
        sorting: sortingState,
        rowSelection: nodeRowSelection,
      },
    },
  });

  const edgesTable = useDataTable({
    data: edgeDataArray,
    columns: edgesColumns,
    state: tableStates.edges,
    onStateChange: (updates) => updateTableState("edges", updates),
    additionalOptions: {
      enableRowSelection: true,
      state: {
        ...tableStates.edges,
        rowSelection: edgeRowSelection,
      },
    },
  });

  const attributesTable = useDataTable({
    data: attributesData,
    columns: attributesColumns,
    state: tableStates.attributes,
    onStateChange: (updates) => updateTableState("attributes", updates),
  });

  const tableCounts = {
    nodes: nodeDataArray.length,
    edges: edgeDataArray.length,
    attributes: attributesData.length,
  };

  return (
    <div
      className="flex h-full w-full flex-col px-3"
      onContextMenu={() => handleContextMenu("data-table")}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-row pt-2">
          <TableTypeToggle
            dataType={activeTableType}
            setDataType={setActiveTableType}
            tableCounts={tableCounts}
          />
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={() => resetTableState(activeTableType)}
            title="Reset current table"
          >
            <RotateCcw className="h-4 w-4" />
          </Button> */}
        </div>
        {activeTableType === "nodes" && (
          <TableSearch
            table={nodesTable}
            searchColumn={tableStates.nodes.searchColumn}
            searchValue={tableStates.nodes.searchValue}
            onSearchColumnChange={(column) =>
              updateTableState("nodes", { searchColumn: column })
            }
            onSearchValueChange={(value) =>
              updateTableState("nodes", { searchValue: value })
            }
          />
        )}
        {activeTableType === "edges" && (
          <TableSearch
            table={edgesTable}
            searchColumn={tableStates.edges.searchColumn}
            searchValue={tableStates.edges.searchValue}
            onSearchColumnChange={(column) =>
              updateTableState("edges", { searchColumn: column })
            }
            onSearchValueChange={(value) =>
              updateTableState("edges", { searchValue: value })
            }
          />
        )}
        {activeTableType === "attributes" && (
          <TableSearch
            table={attributesTable}
            searchColumn={tableStates.attributes.searchColumn}
            searchValue={tableStates.attributes.searchValue}
            onSearchColumnChange={(column) =>
              updateTableState("attributes", { searchColumn: column })
            }
            onSearchValueChange={(value) =>
              updateTableState("attributes", { searchValue: value })
            }
          />
        )}
      </div>

      {activeTableType === "nodes" && (
        <BaseTable
          table={nodesTable}
          columns={nodesColumns}
          scrollPosition={tableStates.nodes.scrollPosition}
          onScrollChange={(position) =>
            updateTableState("nodes", { scrollPosition: position })
          }
        />
      )}
      {activeTableType === "edges" && (
        <BaseTable
          table={edgesTable}
          columns={edgesColumns}
          scrollPosition={tableStates.edges.scrollPosition}
          onScrollChange={(position) =>
            updateTableState("edges", { scrollPosition: position })
          }
        />
      )}
      {activeTableType === "attributes" && (
        <BaseTable
          table={attributesTable}
          columns={attributesColumns}
          scrollPosition={tableStates.attributes.scrollPosition}
          onScrollChange={(position) =>
            updateTableState("attributes", { scrollPosition: position })
          }
        />
      )}
    </div>
  );
};

export default DataTable;
