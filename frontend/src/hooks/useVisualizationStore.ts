import type { AttributeInfo, NodeAttributeValue } from "@/types/network";
import * as d3 from "d3";
import { create } from "zustand";

interface VisualizationStore {
  centralityColorScale: d3.ScaleSequential<string> | null;
  attributeColorScale: d3.ScaleOrdinal<string, string> | null;
  fixedAttributeColors: Map<string, string>;
  centralityKeyIndexMap: Map<string, number>;
  attributeKeyIndexMap: Map<string, number>;

  initializeCentralityColorScale: (keys: string[]) => void;
  initializeAttributeColorScale: (attributeInfos: AttributeInfo[]) => void;
  getColorForKey: (key: string, value?: NodeAttributeValue) => string;
  clearData: () => void;
}

const categoryPalette = d3.schemePaired;

export const useVisualizationStore = create<VisualizationStore>((set, get) => ({
  centralityColorScale: null,
  attributeColorScale: null,
  centralityKeyIndexMap: new Map(),
  attributeKeyIndexMap: new Map(),
  fixedAttributeColors: new Map(),

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
      set({
        attributeColorScale: null,
        attributeKeyIndexMap: new Map(),
        fixedAttributeColors: new Map(),
      });
      return;
    }

    const categories: string[] = [];
    const attributeKeyIndexMap = new Map<string, number>();
    const fixedAttributeColors = new Map<string, string>();

    const numericKeys = attributeInfos.filter(
      (info) => !(info.isNominal || info.isBoolean),
    );

    numericKeys.forEach((info, idx) => {
      const t = idx / Math.max(1, numericKeys.length - 1);
      const color = d3.interpolateCool(t);
      fixedAttributeColors.set(info.key, color);
      attributeKeyIndexMap.set(info.key, idx);
    });

    let catIndex = 0;
    attributeInfos.forEach((info) => {
      if (info.isNominal || info.isBoolean) {
        Array.from(info.values).forEach((val) => {
          const categoryKey = `${info.key}:${val}`;
          categories.push(categoryKey);
          attributeKeyIndexMap.set(categoryKey, catIndex++);
        });
      }
    });

    const attributeColorScale = d3
      .scaleOrdinal<string, string>()
      .domain(categories)
      .range(categoryPalette);

    set({
      attributeColorScale,
      attributeKeyIndexMap,
      fixedAttributeColors,
    });
  },

  getColorForKey: (key: string, value?: NodeAttributeValue) => {
    const {
      centralityColorScale,
      attributeColorScale,
      fixedAttributeColors,
      centralityKeyIndexMap,
      attributeKeyIndexMap,
    } = get();

    if (centralityColorScale && centralityKeyIndexMap.has(key)) {
      return centralityColorScale(centralityKeyIndexMap.get(key)!);
    }

    if (attributeColorScale && value !== undefined) {
      const colorKey = `${key}:${value}`;
      if (attributeKeyIndexMap.has(colorKey)) {
        return attributeColorScale(colorKey);
      }
    }

    if (fixedAttributeColors.has(key)) {
      return fixedAttributeColors.get(key)!;
    }

    return "var(--muted-foreground)";
  },

  clearData: () =>
    set({
      centralityColorScale: null,
      attributeColorScale: null,
      fixedAttributeColors: new Map(),
      centralityKeyIndexMap: new Map(),
      attributeKeyIndexMap: new Map(),
    }),
}));
