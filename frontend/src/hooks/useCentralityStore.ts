import type { Centrality } from "@/types/network";
import { create } from "zustand";

interface CentralityStore {
  centralityData: Centrality[];
  centralityMap: Map<string, Centrality>;
  centralityKeys: string[];
  enabledCentralityKeys: string[];
  sortKey: string;
  centralityRanges: Record<string, { min: number; max: number }>;
  brushRanges: Record<string, [number, number] | null>;

  setCentralityData: (data: Centrality[]) => void;
  setSortKey: (key: string) => void;
  setCentralityRanges: (
    ranges: Record<string, { min: number; max: number }>,
  ) => void;
  toggleCentralityKey: (key: string) => void;
  setEnabledCentralityKeys: (keys: string[]) => void;
  setBrushRange: (key: string, range: [number, number] | null) => void;
  clearBrushRange: (key: string) => void;
  clearAllBrushRanges: () => void;
  clearData: () => void;
}

export const useCentralityStore = create<CentralityStore>((set) => ({
  centralityData: [],
  centralityKeys: [],
  enabledCentralityKeys: [],
  sortKey: "default",
  centralityRanges: {},
  brushRanges: {},
  centralityMap: new Map<string, Centrality>(),

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
      centralityData: data,
      centralityKeys: keys,
      enabledCentralityKeys: keys,
      centralityRanges: ranges,
      centralityMap: map,
    });
  },

  setSortKey: (key) => set({ sortKey: key }),
  setCentralityRanges: (ranges) => set({ centralityRanges: ranges }),

  toggleCentralityKey: (key) =>
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
    }),

  setEnabledCentralityKeys: (keys) => set({ enabledCentralityKeys: keys }),

  setBrushRange: (key, range) =>
    set((s) => ({
      brushRanges: { ...s.brushRanges, [key]: range },
    })),

  clearBrushRange: (key) =>
    set((s) => {
      const { [key]: removed, ...rest } = s.brushRanges;
      return { brushRanges: rest };
    }),

  clearAllBrushRanges: () => set({ brushRanges: {} }),

  clearData: () =>
    set({
      centralityData: [],
      centralityKeys: [],
      enabledCentralityKeys: [],
      centralityRanges: {},
      brushRanges: {},
      centralityMap: new Map(),
    }),
}));
