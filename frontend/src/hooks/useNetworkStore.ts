import type { CombinedData, Network, Node } from "@/types/network";
import { create } from "zustand";

interface NetworkStore {
  network: Network;
  nodeMap: Map<string, Node>;
  selectedNodes: Set<string>;
  hoveredNode: null | CombinedData;
  sortKey: string;
  setNetwork: (data: Network) => void;
  selectNode: (id: string, multi?: boolean) => void;
  deselectNode: (id: string) => void;
  toggleNodeSelection: (id: string) => void;
  setHoveredNode: (node: CombinedData) => void;
  setSortKey: (key: string) => void;
  clearHoveredNode: () => void;
  clearSelection: () => void;
  clearData: () => void;
}

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  network: { nodes: [], links: [] },
  nodeMap: new Map<string, Node>(),
  selectedNodes: new Set<string>(),
  hoveredNode: null,
  sortKey: "none",

  setNetwork: (data) => {
    set({
      network: data,
      nodeMap: new Map(data.nodes.map((n) => [n.id, n])),
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

  clearHoveredNode: () => set({ hoveredNode: null }),
  clearSelection: () => set({ selectedNodes: new Set<string>() }),
  clearData: () =>
    set({
      network: { nodes: [], links: [] },
      nodeMap: new Map(),
      selectedNodes: new Set<string>(),
      hoveredNode: null,
    }),
}));
