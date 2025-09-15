import { create } from "zustand";
import * as d3 from "d3";
import type { Centrality } from "@/types/network";

interface CentralityStore {
  centralityData: Centrality[];
  centralityKeys: string[];
  enabledCentralityKeys: string[];
  sortKey: string;
  centralityRanges: Record<string, { min: number; max: number }>;
  brushRanges: Record<string, [number, number] | null>;

  setSortKey: (key: string) => void;
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
}

export const useCentralityStore = create<CentralityStore>((set) => ({
  centralityData: [],
  centralityKeys: [],
  enabledCentralityKeys: [],
  sortKey: "default",
  centralityRanges: {},
  brushRanges: {},

  setSortKey: (key) => set({ sortKey: key }),

  setCentralityData: (data) => {
    const keysSet = new Set<string>();
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== "id") keysSet.add(key);
      });
    });
    const keys = Array.from(keysSet);

    const ranges: Record<string, { min: number; max: number }> = {};
    keys.forEach((key) => {
      const values = data
        .map((d) => d[key as keyof typeof d])
        .filter((v): v is number => typeof v === "number");

      if (values.length > 0) {
        ranges[key] = {
          min: d3.min(values) ?? 0,
          max: d3.max(values) ?? 0,
        };
      }
    });

    set({
      centralityData: data,
      centralityKeys: keys,
      enabledCentralityKeys: keys,
      centralityRanges: ranges,
    });
  },

  setCentralityRanges: (ranges) => set({ centralityRanges: ranges }),

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

  clearData: () =>
    set({
      centralityData: [],
      centralityKeys: [],
      enabledCentralityKeys: [],
      centralityRanges: {},
      brushRanges: {},
    }),
}));
