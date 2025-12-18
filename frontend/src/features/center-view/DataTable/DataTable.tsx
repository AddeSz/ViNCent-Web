import type { ContextType } from "@/features/center-view/CenterView";
import { useMetricsStore } from "@/stores/useMetricsStore";
import type { FullData } from "@/types/network";
import { formatValue } from "@/utils/utils";
import type {
  ColumnFiltersState,
  ColumnSizingState,
  PaginationState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import AttributesTable from "./tables/AttributesTable";
import EdgesTable from "./tables/EdgesTable";
import NodesTable from "./tables/NodesTable";

interface DataTableProps {
  nodeData: FullData[];
  edgeData: Map<string, FullData>;
  nodeMap: Map<string, FullData>;
  sorting: SortingState;
  onSortingChange: (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => void;
  handleContextMenu: (target: ContextType, data?: any) => void;
}

interface NodesTableState {
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  columnSizing: ColumnSizingState;
  pagination: PaginationState;
  visibilityFilter: "all" | "hidden" | "visible" | "selected";
}

interface EdgesTableState {
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  columnSizing: ColumnSizingState;
  pagination: PaginationState;
  sorting: SortingState;
}

interface AttributesTableState {
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  columnSizing: ColumnSizingState;
  pagination: PaginationState;
  sorting: SortingState;
}

const DataTable = ({
  nodeData,
  edgeData,
  nodeMap,
  sorting,
  onSortingChange,
  handleContextMenu,
}: DataTableProps) => {
  const metricsInfo = useMetricsStore((s) => s.currentMetricsInfo);
  const [dataType, setDataType] = useState<"nodes" | "edges" | "attributes">(
    "nodes",
  );

  const [nodesState, setNodesState] = useState<NodesTableState>({
    columnFilters: [],
    columnVisibility: {},
    columnSizing: {},
    pagination: { pageIndex: 0, pageSize: 25 },
    visibilityFilter: "all",
  });

  const [edgesState, setEdgesState] = useState<EdgesTableState>({
    columnFilters: [],
    columnVisibility: {},
    columnSizing: {},
    pagination: { pageIndex: 0, pageSize: 25 },
    sorting: [],
  });

  const [attributesState, setAttributesState] = useState<AttributesTableState>({
    columnFilters: [],
    columnVisibility: {},
    columnSizing: {},
    pagination: { pageIndex: 0, pageSize: 25 },
    sorting: [],
  });

  const edgeDataArray = useMemo(
    () => Array.from(edgeData.values()),
    [edgeData],
  );

  const attributesData = useMemo(
    () =>
      Array.from(metricsInfo.entries()).map(([key, info]) => ({
        id: key,
        key,
        isNumeric: info.isNumeric || false,
        isCategory: info.isCategory || false,
        isCommunity: info.isCommunity || false,
        isCentrality: info.isCentrality || false,
        range: info.range
          ? `${formatValue(info.range.min)} - ${formatValue(info.range.max)}`
          : "N/A",
        minValue: info.range?.min ?? null,
        maxValue: info.range?.max ?? null,
        uniqueValues: info.values?.size ?? 0,
      })),
    [metricsInfo],
  );

  const tableCounts = {
    nodes: nodeData.length,
    edges: edgeDataArray.length,
    attributes: attributesData.length,
  };

  return (
    <div
      className="flex h-full w-full flex-col px-3"
      onContextMenu={() => handleContextMenu("data-table")}
    >
      {dataType === "nodes" && (
        <NodesTable
          data={nodeData}
          sorting={sorting}
          onSortingChange={onSortingChange}
          dataType={dataType}
          setDataType={setDataType}
          tableCounts={tableCounts}
          tableState={nodesState}
          setTableState={setNodesState}
        />
      )}
      {dataType === "edges" && (
        <EdgesTable
          data={edgeDataArray}
          nodeMap={nodeMap}
          dataType={dataType}
          setDataType={setDataType}
          tableCounts={tableCounts}
          tableState={edgesState}
          setTableState={setEdgesState}
        />
      )}
      {dataType === "attributes" && (
        <AttributesTable
          data={attributesData}
          dataType={dataType}
          setDataType={setDataType}
          tableCounts={tableCounts}
          tableState={attributesState}
          setTableState={setAttributesState}
        />
      )}
    </div>
  );
};

export default DataTable;
