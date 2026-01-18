import { useCallback, useState } from "react";
import type { TableType } from "../DataTable";
import type {
  AttributesTableState,
  EdgesTableState,
  NodesTableState,
} from "./useDataTable";

export interface TableStates {
  nodes: NodesTableState;
  edges: EdgesTableState;
  attributes: AttributesTableState;
}

const DEFAULT_TABLE_STATES: TableStates = {
  nodes: {
    columnFilters: [],
    columnVisibility: {},
    columnSizing: {},
    pagination: { pageIndex: 0, pageSize: 25 },
    visibilityFilter: "all",
    scrollPosition: 0,
    searchColumn: "label",
    searchValue: "",
  },
  edges: {
    columnFilters: [],
    columnVisibility: {},
    columnSizing: {},
    pagination: { pageIndex: 0, pageSize: 25 },
    sorting: [],
    scrollPosition: 0,
    searchColumn: "source",
    searchValue: "",
  },
  attributes: {
    columnFilters: [],
    columnVisibility: {},
    columnSizing: {},
    pagination: { pageIndex: 0, pageSize: 25 },
    sorting: [],
    scrollPosition: 0,
    searchColumn: "key",
    searchValue: "",
  },
};

export function useTableStates() {
  const [tableStates, setTableStates] =
    useState<TableStates>(DEFAULT_TABLE_STATES);
  const [activeTableType, setActiveTableType] = useState<TableType>("nodes");

  const updateTableState = useCallback(
    <T extends TableType>(type: T, updates: Partial<TableStates[T]>) => {
      setTableStates((prev) => ({
        ...prev,
        [type]: { ...prev[type], ...updates },
      }));
    },
    [],
  );

  const resetTableStates = useCallback(() => {
    setTableStates(JSON.parse(JSON.stringify(DEFAULT_TABLE_STATES)));
  }, []);

  const resetTableState = useCallback(<T extends TableType>(type: T) => {
    setTableStates((prev) => ({
      ...prev,
      [type]: JSON.parse(JSON.stringify(DEFAULT_TABLE_STATES[type])),
    }));
  }, []);

  return {
    tableStates,
    updateTableState,
    resetTableStates,
    resetTableState,
    activeTableType,
    setActiveTableType,
  };
}
