import type { AttributeInfo, NodeAttributeValue } from "@/types/network";
import * as d3 from "d3";
import { create } from "zustand";

interface VisualizationStore {
  centralityColorScale: d3.ScaleSequential<string> | null;
  attributeColorScale: d3.ScaleOrdinal<string, string> | null;
  fixedAttributeColors: Map<string, string>;
  centralityKeyIndexMap: Map<string, number>;
  attributeKeyIndexMap: Map<string, number>;
  initializeColorScales: (metricInfos: AttributeInfo[]) => void;
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

  initializeColorScales: (metricInfos) => {
    const centralityInfos = metricInfos.filter((info) => info.isCentrality);
    const attributeInfos = metricInfos.filter((info) => !info.isCentrality);

    let centralityColorScale: d3.ScaleSequential<string> | null = null;
    let centralityKeyIndexMap = new Map<string, number>();

    if (centralityInfos.length > 0) {
      const centralityKeys = centralityInfos.map((info) => info.key);
      centralityKeyIndexMap = new Map(centralityKeys.map((key, i) => [key, i]));
      centralityColorScale = d3
        .scaleSequential<string>()
        .domain([0, Math.max(0, centralityKeys.length - 1)])
        .interpolator(d3.interpolateSpectral);
    }

    let attributeColorScale: d3.ScaleOrdinal<string, string> | null = null;
    let attributeKeyIndexMap = new Map<string, number>();
    let fixedAttributeColors = new Map<string, string>();

    if (attributeInfos.length > 0) {
      const categories: string[] = [];

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

      if (categories.length > 0) {
        attributeColorScale = d3
          .scaleOrdinal<string, string>()
          .domain(categories)
          .range(categoryPalette);
      }
    }

    set({
      centralityColorScale,
      attributeColorScale,
      centralityKeyIndexMap,
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
