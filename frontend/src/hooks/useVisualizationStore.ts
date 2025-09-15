import { create } from "zustand";
import * as d3 from "d3";

interface VisualizationStore {
  colorScale: d3.ScaleSequential<string> | null;
  keyIndexMap: Map<string, number>;
  initializeColorScale: (keys: string[]) => void;
  getColorForKey: (key: string) => string;
  clearData: () => void;
}

export const useVisualizationStore = create<VisualizationStore>((set, get) => ({
  colorScale: null,
  keyIndexMap: new Map(),

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

  getColorForKey: (key) => {
    const { colorScale, keyIndexMap } = get();
    if (!colorScale || !keyIndexMap.has(key)) {
      return "var(--muted-foreground)";
    }
    return colorScale(keyIndexMap.get(key)!);
  },

  clearData: () => set({ colorScale: null, keyIndexMap: new Map() }),
}));
