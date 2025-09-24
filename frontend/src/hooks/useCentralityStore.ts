import type { Centrality } from "@/types/network";
import { create } from "zustand";

interface CentralityStore {
  centralityData: Map<string, Centrality>;
  centralityKeys: string[];
  enabledCentralityKeys: string[];
  centralityRanges: Record<string, { min: number; max: number }>;
  brushRanges: Record<string, [number, number] | null>;
  filteredCentralityData: Map<string, Centrality>;

  setCentralityData: (data: Centrality[]) => void;
  setCentralityRanges: (
    ranges: Record<string, { min: number; max: number }>,
  ) => void;
  toggleCentralityKey: (key: string) => void;
  setEnabledCentralityKeys: (keys: string[]) => void;
  setBrushRange: (key: string, range: [number, number] | null) => void;
  clearBrushRange: (key: string) => void;
  clearAllBrushRanges: () => void;
  clearData: () => void;

  _updateFilteredData: () => void;
}

const filterAndMapCentralityData = (
  centralityData: Map<string, Centrality>,
  enabledCentralityKeys: string[],
  brushRanges: Record<string, [number, number] | null>,
): Map<string, Centrality> => {
  const filtered = new Map<string, Centrality>();

  centralityData.forEach((item, id) => {
    const matches = enabledCentralityKeys.every((key) => {
      const value = item[key];
      const range = brushRanges[key];
      if (!range) return true;
      if (typeof value !== "number") return false;
      const [min, max] = range;
      return value >= min && value <= max;
    });

    if (matches) {
      const result: Centrality = { id: item.id };
      for (const key of enabledCentralityKeys) {
        if (key in item) {
          result[key] = item[key];
        }
      }
      filtered.set(id, result);
    }
  });

  return filtered;
};

export const useCentralityStore = create<CentralityStore>((set, get) => ({
  centralityKeys: [],
  enabledCentralityKeys: [],
  centralityRanges: {},
  brushRanges: {},
  centralityData: new Map<string, Centrality>(),
  filteredCentralityData: new Map<string, Centrality>(),

  _updateFilteredData: () => {
    const state = get();
    const filtered = filterAndMapCentralityData(
      state.centralityData,
      state.enabledCentralityKeys,
      state.brushRanges,
    );
    set({ filteredCentralityData: filtered });
  },

  setCentralityData: (data) => {
    const keysSet = new Set<string>();
    const map = new Map<string, Centrality>();
    const ranges: Record<string, { min: number; max: number }> = {};

    data.forEach((item) => {
      Object.entries(item).forEach(([key, value]) => {
        if (key === "id") return;
        keysSet.add(key);
        if (typeof value === "number") {
          if (!ranges[key]) ranges[key] = { min: value, max: value };
          else {
            ranges[key].min = Math.min(ranges[key].min, value);
            ranges[key].max = Math.max(ranges[key].max, value);
          }
        }
      });
      map.set(item.id, item);
    });

    const keys = Array.from(keysSet);
    set({
      centralityKeys: keys,
      enabledCentralityKeys: keys,
      centralityRanges: ranges,
      centralityData: map,
    });

    get()._updateFilteredData();
  },

  setCentralityRanges: (ranges) => set({ centralityRanges: ranges }),

  toggleCentralityKey: (key) => {
    set((s) => {
      const isEnabled = s.enabledCentralityKeys.includes(key);
      if (isEnabled) {
        return {
          enabledCentralityKeys: s.enabledCentralityKeys.filter(
            (k) => k !== key,
          ),
        };
      } else {
        return {
          enabledCentralityKeys: s.centralityKeys.filter(
            (k) => k === key || s.enabledCentralityKeys.includes(k),
          ),
        };
      }
    });

    get()._updateFilteredData();
  },

  setEnabledCentralityKeys: (keys) => {
    set({ enabledCentralityKeys: keys });
    get()._updateFilteredData();
  },

  setBrushRange: (key, range) => {
    set((s) => ({
      brushRanges: { ...s.brushRanges, [key]: range },
    }));
    get()._updateFilteredData();
  },

  clearBrushRange: (key) => {
    set((s) => {
      const { [key]: removed, ...rest } = s.brushRanges;
      return { brushRanges: rest };
    });
    get()._updateFilteredData();
  },

  clearAllBrushRanges: () => {
    set({ brushRanges: {} });
    get()._updateFilteredData();
  },

  clearData: () =>
    set({
      centralityKeys: [],
      enabledCentralityKeys: [],
      centralityRanges: {},
      brushRanges: {},
      centralityData: new Map(),
      filteredCentralityData: new Map<string, Centrality>(),
    }),
}));
