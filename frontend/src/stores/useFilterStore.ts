import { type BinnedData } from "@/features/chart-filtering/components/createBinnedData";
import type { AttributeInfo } from "@/types";
import { create } from "zustand";
import { useInteractionStore } from "./useInteractionStore";

export interface BrushRange {
  range: [number, number];
  inclusive: boolean;
}

interface FilterStore {
  hiddenNodes: Set<string>;
  brushRanges: Record<string, BrushRange | null>;
  selectedCategories: Record<string, string[]>;
  disabledValues: Record<string, Set<number | string>>;
  binnedDataByKey: Map<string, BinnedData>;
  disabledNodeMetricsKeys: Set<string>;
  disabledEdgeMetricsKeys: Set<string>;

  hideNode: (id: string) => void;
  hideNodes: (ids: string[]) => void;
  restoreNode: (id: string) => void;
  restoreAllNodes: () => void;
  hideSelection: () => void;

  initializeBrushRanges: (metrics: Record<string, AttributeInfo>) => void;
  setBrushRange: (key: string, brushRange: BrushRange | null) => void;
  clearBrushRange: (key: string) => void;

  setSelectedCategories: (key: string, categories: string[]) => void;

  setBinnedData: (key: string, binnedData: BinnedData | null) => void;
  clearBinnedData: () => void;

  setDisabledValues: (key: string, values: Set<number | string>) => void;
  clearDisabledValues: (key: string) => void;

  toggleMetricsKey: (key: string, isEdgeKey: boolean) => boolean;

  clearData: () => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  hiddenNodes: new Set(),
  brushRanges: {},
  selectedCategories: {},
  disabledValues: {},
  binnedDataByKey: new Map(),
  disabledNodeMetricsKeys: new Set(),
  disabledEdgeMetricsKeys: new Set(),

  hideNode: (id) =>
    set((s) => {
      const next = new Set(s.hiddenNodes);
      next.add(id);
      return { hiddenNodes: next };
    }),

  hideNodes: (ids) =>
    set((s) => {
      const next = new Set(s.hiddenNodes);
      ids.forEach((id) => next.add(id));
      return { hiddenNodes: next };
    }),

  restoreNode: (id) =>
    set((s) => {
      const next = new Set(s.hiddenNodes);
      next.delete(id);
      return { hiddenNodes: next };
    }),

  restoreAllNodes: () => set({ hiddenNodes: new Set() }),
  hideSelection: () => {
    const { selectedNodes } = useInteractionStore.getState();
    if (selectedNodes.size === 0) return;

    set((s) => {
      const next = new Set(s.hiddenNodes);
      selectedNodes.forEach((id) => next.add(id));
      return { hiddenNodes: next };
    });

    useInteractionStore.getState().clearSelectedNodes();
  },

  initializeBrushRanges: (metrics: Record<string, AttributeInfo>) =>
    set({
      brushRanges: Object.fromEntries(
        Object.entries(metrics)
          .filter(([_, info]) => info.range !== null)
          .map(([key]) => [key, null]),
      ),
    }),
  setBrushRange: (key, brushRange) =>
    set((s) => ({ brushRanges: { ...s.brushRanges, [key]: brushRange } })),

  clearBrushRange: (key) =>
    set((s) => ({ brushRanges: { ...s.brushRanges, [key]: null } })),

  setSelectedCategories: (key, categories) =>
    set((s) => ({
      selectedCategories: { ...s.selectedCategories, [key]: categories },
    })),

  setBinnedData: (key, binnedData) =>
    set((s) => {
      const next = new Map(s.binnedDataByKey);
      if (binnedData === null) next.delete(key);
      else next.set(key, binnedData);
      return { binnedDataByKey: next };
    }),

  clearBinnedData: () => set({ binnedDataByKey: new Map() }),

  setDisabledValues: (key, values) =>
    set((s) => ({ disabledValues: { ...s.disabledValues, [key]: values } })),

  clearDisabledValues: (key) =>
    set((s) => ({
      disabledValues: { ...s.disabledValues, [key]: new Set() },
    })),

  toggleMetricsKey: (key, isEdgeKey) => {
    let justDisabled = false;

    set((s) => {
      const source = isEdgeKey
        ? s.disabledEdgeMetricsKeys
        : s.disabledNodeMetricsKeys;
      const next = new Set(source);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        justDisabled = true;
      }

      return isEdgeKey
        ? { disabledEdgeMetricsKeys: next }
        : { disabledNodeMetricsKeys: next };
    });

    return justDisabled;
  },

  clearData: () =>
    set({
      hiddenNodes: new Set(),
      brushRanges: {},
      selectedCategories: {},
      disabledValues: {},
      binnedDataByKey: new Map(),
      disabledNodeMetricsKeys: new Set(),
      disabledEdgeMetricsKeys: new Set(),
    }),
}));
