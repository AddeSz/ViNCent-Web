import { create } from "zustand";
import type { Network, Node } from "@/types/network";

interface NetworkStore {
  network: Network;
  nodeMap: Map<string, Node>;
  selectedNodes: Set<string>;
  setNetwork: (data: Network) => void;
  selectNode: (id: string, multi?: boolean) => void;
  deselectNode: (id: string) => void;
  toggleNodeSelection: (id: string) => void;
  clearSelection: () => void;
  clearData: () => void;
}

export const useNetworkStore = create<NetworkStore>((set, get) => ({
  network: { nodes: [], links: [] },
  nodeMap: new Map<string, Node>(),
  selectedNodes: new Set<string>(),

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

  clearSelection: () => set({ selectedNodes: new Set<string>() }),

  clearData: () =>
    set({
      network: { nodes: [], links: [] },
      nodeMap: new Map(),
      selectedNodes: new Set<string>(),
    }),
}));
