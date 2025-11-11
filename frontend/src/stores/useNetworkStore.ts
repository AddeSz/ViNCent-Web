import type { Network, Node } from "@/types/network";
import type { SortingState } from "@tanstack/react-table";
import { create } from "zustand";

interface NetworkStore {
  network: Network;
  nodeMap: Map<string, Node>;
  selectedNodes: Set<string>;
  hoveredNode: null | string;
  sortKey: string;
  sortingState: SortingState;

  resetRadialZoomFlag: Boolean;
  resetNodeLinkZoomFlag: Boolean;
  hiddenNodes: Set<string>;
  currentDataset: string | null;

  restartSimulationFlag: boolean;
  setRestartSimulationFlag: (flag: boolean) => void;

  setNetwork: (data: Network) => void;
  selectNode: (id: string, multi?: boolean) => void;
  deselectNode: (id: string) => void;
  toggleNodeSelection: (id: string) => void;
  setHoveredNode: (node: string | null) => void;

  setSortKey: (key: string) => void;
  setSortingState: (sorting: SortingState) => void;

  resetRadialZoom: () => void;
  resetNodeLinkZoom: () => void;

  hideNode: (id: string) => void;
  restoreNode: (id: string) => void;
  restoreAllNodes: () => void;

  setCurrentDataset: (dataset: string) => void;

  clearSelection: () => void;
  clearData: () => void;

  isNetworkEmpty: () => boolean;
}

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  network: { nodes: [], links: [] },
  nodeMap: new Map<string, Node>(),
  linkCountMap: new Map<string, number>(),
  selectedNodes: new Set<string>(),
  hoveredNode: null,
  sortKey: "none",
  sortingState: [],

  resetRadialZoomFlag: false,
  resetNodeLinkZoomFlag: false,
  hiddenNodes: new Set<string>(),
  currentDataset: null,
  restartSimulationFlag: false,

  setNetwork: (data) => {
    const nodeMap = new Map<string, Node>(data.nodes.map((n) => [n.id, n]));
    set({
      network: data,
      nodeMap,
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

  setHoveredNode: (node) => set({ hoveredNode: node }),
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

  clearSelection: () => set({ selectedNodes: new Set<string>() }),
  clearData: () =>
    set({
      network: { nodes: [], links: [] },
      nodeMap: new Map(),
      selectedNodes: new Set<string>(),
      hoveredNode: null,
      sortKey: "none",
      sortingState: [],
    }),

  setRestartSimulationFlag: (flag) => set({ restartSimulationFlag: flag }),

  isNetworkEmpty: () => {
    const { network } = get();
    return network.nodes.length === 0 && network.links.length === 0;
  },
}));
