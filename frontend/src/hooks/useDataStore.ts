import { create } from "zustand";
import * as d3 from "d3";
import type { Network, Centrality } from "@/types/network";

interface DataStore {
  network: Network;
  selectedNodes: Set<string>;
  setNetwork: (data: Network) => void;
  selectNode: (id: string, multi?: boolean) => void;
  deselectNode: (id: string) => void;
  toggleNodeSelection: (id: string) => void;
  clearSelection: () => void;

  centralityData: Centrality[];
  centralityKeys: string[];
  enabledCentralityKeys: string[];
  sortKey: string;
  setSortKey: (key: string) => void;
  setCentralityData: (data: Centrality[]) => void;
  toggleCentralityKey: (key: string) => void;
  setEnabledCentralityKeys: (keys: string[]) => void;

  colorScale: d3.ScaleSequential<string> | null;
  keyIndexMap: Map<string, number>;
  initializeColorScale: (keys: string[]) => void;
  getColorForKey: (key: string) => string;

  // Brushing/Filtering
  brushRanges: Record<string, [number, number] | null>;
  setBrushRange: (key: string, range: [number, number] | null) => void;
  clearBrushRange: (key: string) => void;
  clearAllBrushRanges: () => void;

  clearData: () => void;
}

export const useDataStore = create<DataStore>((set, get) => {
  const getColorForKey = (key: string) => {
    const { colorScale, keyIndexMap } = get();
    if (!colorScale || !keyIndexMap.has(key)) {
      return "var(--muted-foreground)";
    }
    return colorScale(keyIndexMap.get(key)!);
  };

  return {
    network: { nodes: [], edges: [] },
    centralityData: [],
    centralityKeys: [],
    enabledCentralityKeys: [],
    selectedNodes: new Set<string>(),

    colorScale: null,
    keyIndexMap: new Map(),

    brushRanges: {},

    sortKey: "default",
    setSortKey: (key) => set({ sortKey: key }),

    setBrushRange: (key, range) =>
      set((state) => ({
        brushRanges: { ...state.brushRanges, [key]: range },
      })),

    clearBrushRange: (key) =>
      set((state) => {
        const { [key]: removed, ...rest } = state.brushRanges;
        return { brushRanges: rest };
      }),

    clearAllBrushRanges: () => set({ brushRanges: {} }),

    initializeColorScale: (keys) => {
      if (keys.length === 0) {
        set({ colorScale: null, keyIndexMap: new Map() });
        return;
      }

      const keyIndexMap = new Map(keys.map((key, i) => [key, i]));
      const colorScale = d3
        .scaleSequential<string>()
        .domain([0, Math.max(0, keys.length - 1)])
        .interpolator(d3.interpolateSpectral);

      set({ colorScale, keyIndexMap });
    },

    getColorForKey,

    setNetwork: (data) => set({ network: data }),

    setCentralityData: (data) => {
      const keysSet = new Set<string>();
      data.forEach((item) => {
        Object.keys(item).forEach((key) => {
          if (key !== "id") keysSet.add(key);
        });
      });
      const keys = Array.from(keysSet);

      get().initializeColorScale(keys);

      set({
        centralityData: data,
        centralityKeys: keys,
        enabledCentralityKeys: keys,
      });
    },

    toggleCentralityKey: (key) =>
      set((state) => {
        const isEnabled = state.enabledCentralityKeys.includes(key);

        if (isEnabled) {
          return {
            enabledCentralityKeys: state.enabledCentralityKeys.filter(
              (k) => k !== key,
            ),
          };
        } else {
          return {
            enabledCentralityKeys: state.centralityKeys.filter(
              (k) => k === key || state.enabledCentralityKeys.includes(k),
            ),
          };
        }
      }),

    setEnabledCentralityKeys: (keys) => set({ enabledCentralityKeys: keys }),

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
        enabledCentralityKeys: [],
        selectedNodes: new Set<string>(),
        colorScale: null,
        keyIndexMap: new Map(),
        brushRanges: {},
      }),
  };
});
