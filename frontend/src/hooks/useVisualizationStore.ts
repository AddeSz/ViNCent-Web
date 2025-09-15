import { create } from "zustand";
import * as d3 from "d3";
import type { AttributeInfo } from "@/types/network";

interface VisualizationStore {
  centralityColorScale: d3.ScaleSequential<string> | null;
  attributeColorScale: d3.ScaleOrdinal<string, string> | null;
  centralityKeyIndexMap: Map<string, number>;
  attributeKeyIndexMap: Map<string, number>;

  initializeCentralityColorScale: (keys: string[]) => void;
  initializeAttributeColorScale: (attributeInfos: AttributeInfo[]) => void;
  getColorForKey: (key: string, value?: string | number) => string;
  clearData: () => void;
}

export const useVisualizationStore = create<VisualizationStore>((set, get) => ({
  centralityColorScale: null,
  attributeColorScale: null,
  centralityKeyIndexMap: new Map(),
  attributeKeyIndexMap: new Map(),

  initializeCentralityColorScale: (keys) => {
    if (keys.length === 0) {
      set({ centralityColorScale: null, centralityKeyIndexMap: new Map() });
      return;
    }

    const centralityKeyIndexMap = new Map(keys.map((key, i) => [key, i]));
    const centralityColorScale = d3
      .scaleSequential<string>()
      .domain([0, Math.max(0, keys.length - 1)])
      .interpolator(d3.interpolateSpectral);

    set({ centralityColorScale, centralityKeyIndexMap });
  },

  initializeAttributeColorScale: (attributeInfos) => {
    if (attributeInfos.length === 0) {
      set({ attributeColorScale: null, attributeKeyIndexMap: new Map() });
      return;
    }

    const categories: string[] = [];
    const attributeKeyIndexMap = new Map<string, number>();
    let index = 0;

    attributeInfos.forEach((info) => {
      if (info.isCategorical) {
        Array.from(info.values).forEach((val) => {
          const categoryKey = `${info.key}:${val}`;
          categories.push(categoryKey);
          attributeKeyIndexMap.set(categoryKey, index++);
        });
      } else {
        attributeKeyIndexMap.set(info.key, index++);
      }
    });

    const attributeColorScale = d3
      .scaleOrdinal<string, string>()
      .domain(categories)
      .range(d3.schemeCategory10.concat(d3.schemeSet3 as string[]));

    set({ attributeColorScale, attributeKeyIndexMap });
  },

  getColorForKey: (key: string, value?: string | number) => {
    const {
      centralityColorScale,
      attributeColorScale,
      centralityKeyIndexMap,
      attributeKeyIndexMap,
    } = get();

    if (centralityColorScale && centralityKeyIndexMap.has(key)) {
      return centralityColorScale(centralityKeyIndexMap.get(key)!);
    }

    if (attributeColorScale) {
      let colorKey = key;
      if (value !== undefined) {
        colorKey = `${key}:${value}`;
      }
      if (attributeKeyIndexMap.has(colorKey)) {
        return attributeColorScale(colorKey);
      }
    }

    return "var(--muted-foreground)";
  },

  clearData: () =>
    set({
      centralityColorScale: null,
      attributeColorScale: null,
      centralityKeyIndexMap: new Map(),
      attributeKeyIndexMap: new Map(),
    }),
}));
