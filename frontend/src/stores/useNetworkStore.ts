import type { Edge, Network, Node } from "@/types/network";
import type { SortingState } from "@tanstack/react-table";
import { create } from "zustand";

interface NetworkStore {
  network: Network;
  nodeMap: Map<string, Node>;
  edgeMap: Map<string, Edge>;
  selectedNodes: Set<string>;
  hoveredNode: null | string;
  hoveredCommunity: { key: string; id: number } | null;
  sortKey: string;
  sortingState: SortingState;
  directed: boolean | null;

  resetRadialZoomFlag: Boolean;
  resetNodeLinkZoomFlag: Boolean;
  hiddenNodes: Set<string>;
  currentDataset: string | null;

  restartSimulationFlag: boolean;
  setRestartSimulationFlag: (flag: boolean) => void;

  setNetwork: (data: Network, graphType: string) => void;
  selectNode: (id: string, multi?: boolean) => void;
  deselectNode: (id: string) => void;
  toggleNodeSelection: (id: string) => void;
  toggleNodesSelection: (ids: string[]) => void;
  setHoveredNode: (node: string | null) => void;
  setHoveredCommunity: (key: string | null, id: number | null) => void;

  setSortKey: (key: string) => void;
  setSortingState: (sorting: SortingState) => void;

  resetRadialZoom: () => void;
  resetNodeLinkZoom: () => void;

  hideNode: (id: string) => void;
  restoreNode: (id: string) => void;
  restoreAllNodes: () => void;
  hideSelection: () => void;

  setCurrentDataset: (dataset: string) => void;

  clearSelection: () => void;
  clearData: () => void;

  isNetworkEmpty: () => boolean;
}

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  network: { nodes: [], edges: [] },
  nodeMap: new Map<string, Node>(),
  edgeMap: new Map<string, Edge>(),
  linkCountMap: new Map<string, number>(),
  selectedNodes: new Set<string>(),
  hoveredNode: null,
  hoveredCommunity: null,
  sortKey: "none",
  sortingState: [],
  directed: null,

  resetRadialZoomFlag: false,
  resetNodeLinkZoomFlag: false,
  hiddenNodes: new Set<string>(),
  currentDataset: null,
  restartSimulationFlag: false,

  setNetwork: (data, graphType) => {
    const nodeMap = new Map<string, Node>(data.nodes.map((n) => [n.id, n]));
    const edgeMap = new Map<string, Edge>(data.edges.map((e) => [e.id, e]));
    let directed = true;
    if (graphType === "undirected") {
      directed = false;
    }
    set({
      network: data,
      nodeMap,
      edgeMap,
      directed,
    });
  },

  selectNode: (id, multi = false) => {
    const current = get().selectedNodes;
    const next = multi ? new Set<string>(current) : new Set<string>();
    next.add(id);
    set({ selectedNodes: next });
  },

  deselectNode: (id) => {
    const current = get().selectedNodes;
    const next = new Set<string>(current);
    next.delete(id);
    set({ selectedNodes: next });
  },

  toggleNodeSelection: (id) => {
    const current = get().selectedNodes;
    const next = new Set<string>(current);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    set({ selectedNodes: next });
  },

  toggleNodesSelection: (ids: string[]) => {
    const { selectedNodes } = get();
    const allSelected = ids.every((id) => selectedNodes.has(id));

    set((state) => {
      const next = new Set(state.selectedNodes);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return { selectedNodes: next };
    });
  },

  setHoveredNode: (node) => set({ hoveredNode: node }),
  setHoveredCommunity: (key, id) =>
    set({
      hoveredCommunity: key == null || id == null ? null : { key, id },
    }),

  setSortKey: (key: string) => set({ sortKey: key }),
  setSortingState: (sorting: SortingState) => set({ sortingState: sorting }),

  resetRadialZoom: () => set({ resetRadialZoomFlag: true }),
  resetNodeLinkZoom: () => set({ resetNodeLinkZoomFlag: true }),

  setCurrentDataset: (dataset: string) => set({ currentDataset: dataset }),

  hideNode: (id) =>
    set((state) => {
      const next = new Set(state.hiddenNodes);
      next.add(id);
      return { hiddenNodes: next };
    }),

  restoreNode: (id) =>
    set((state) => {
      const next = new Set(state.hiddenNodes);
      next.delete(id);
      return { hiddenNodes: next };
    }),

  restoreAllNodes: () => set({ hiddenNodes: new Set() }),

  hideSelection: () => {
    const { selectedNodes } = get();
    if (selectedNodes.size === 0) return;

    set((state) => {
      const next = new Set(state.hiddenNodes);
      selectedNodes.forEach((id) => next.add(id));
      return { hiddenNodes: next, selectedNodes: new Set<string>() };
    });
  },

  clearSelection: () => set({ selectedNodes: new Set<string>() }),

  setRestartSimulationFlag: (flag) => set({ restartSimulationFlag: flag }),

  isNetworkEmpty: () => {
    const { network } = get();
    return network.nodes.length === 0 && network.edges.length === 0;
  },

  clearData: () =>
    set({
      network: { nodes: [], edges: [] },
      nodeMap: new Map(),
      edgeMap: new Map(),
      selectedNodes: new Set<string>(),
      hoveredNode: null,
      hoveredCommunity: null,
      sortKey: "none",
      sortingState: [],
      currentDataset: null,
      directed: null,
      resetRadialZoomFlag: false,
      resetNodeLinkZoomFlag: false,
      hiddenNodes: new Set<string>(),
      restartSimulationFlag: false,
    }),
}));
