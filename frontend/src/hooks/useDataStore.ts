import { create } from "zustand";
import type { Network, Centrality } from "@/types/network";

interface DataStore {
  network: Network;
  centralityData: Centrality[];
  centralityKeys: string[];
  selectedNodes: Set<string>;

  selectNode: (id: string, multi?: boolean) => void;
  deselectNode: (id: string) => void;
  toggleNodeSelection: (id: string) => void;
  clearSelection: () => void;

  setNetwork: (data: Network) => void;
  setCentralityData: (data: Centrality[]) => void;

  clearData: () => void;
}

export const useDataStore = create<DataStore>((set, get) => ({
  network: { nodes: [], edges: [] },
  centralityData: [],
  centralityKeys: [],
  selectedNodes: new Set<string>(),

  setNetwork: (data) => set({ network: data }),
    setCentralityData: (data) => {
    const keysSet = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== "id") keysSet.add(key);
      });
    });
    const keys = Array.from(keysSet);
    set({ centralityData: data, centralityKeys: keys });
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
      network: { nodes: [], edges: [] },
      centralityData: [],
      centralityKeys: [],
      selectedNodes: new Set<string>(),
    }),
}));
