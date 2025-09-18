import type { AttributeInfo } from "@/types/network";
import * as d3 from "d3";
import { create } from "zustand";

interface VisualizationStore {
  centralityColorScale: d3.ScaleSequential<string> | null;
  attributeColorScale: d3.ScaleOrdinal<string, string> | null;
  numericAttributeColorScales: Map<string, d3.ScaleSequential<string>>;
  fixedAttributeColors: Map<string, string>;
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
  numericAttributeColorScales: new Map(),
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
        numericAttributeColorScales: new Map(),
        fixedAttributeColors: new Map(),
      });
      return;
    }

    const categories: string[] = [];
    const attributeKeyIndexMap = new Map<string, number>();
    const numericAttributeColorScales = new Map<
      string,
      d3.ScaleSequential<string>
    >();
    const fixedAttributeColors = new Map<string, string>();
    let index = 0;

    const fixedColorPalette = d3.schemeCategory10.concat(
      d3.schemeSet3 as string[],
    );

    attributeInfos.forEach((info) => {
      if (info.isCategorical) {
        Array.from(info.values).forEach((val) => {
          const categoryKey = `${info.key}:${val}`;
          categories.push(categoryKey);
          attributeKeyIndexMap.set(categoryKey, index++);
        });
      } else if (info.type === "number" && !info.isCategorical) {
        const values = Array.from(info.values as Set<number>);
        const [min, max] = d3.extent(values) as [number, number];
        numericAttributeColorScales.set(
          info.key,
          d3.scaleSequential(d3.interpolateViridis).domain([min, max]),
        );
        attributeKeyIndexMap.set(info.key, index++);
      } else {
        const color = fixedColorPalette[index % fixedColorPalette.length];
        fixedAttributeColors.set(info.key, color);
        attributeKeyIndexMap.set(info.key, index++);
      }
    });

    const attributeColorScale = d3
      .scaleOrdinal<string, string>()
      .domain(categories)
      .range(d3.schemeCategory10.concat(d3.schemeSet3 as string[]));

    set({
      attributeColorScale,
      attributeKeyIndexMap,
      numericAttributeColorScales,
      fixedAttributeColors,
    });
  },

  getColorForKey: (key: string, value?: string | number) => {
    const {
      centralityColorScale,
      attributeColorScale,
      numericAttributeColorScales,
      fixedAttributeColors,
      centralityKeyIndexMap,
      attributeKeyIndexMap,
    } = get();

    if (centralityColorScale && centralityKeyIndexMap.has(key)) {
      return centralityColorScale(centralityKeyIndexMap.get(key)!);
    }

    if (attributeColorScale) {
      if (value !== undefined) {
        const colorKey = `${key}:${value}`;
        if (attributeKeyIndexMap.has(colorKey)) {
          return attributeColorScale(colorKey);
        }
      }
    }

    if (numericAttributeColorScales.has(key) && typeof value === "number") {
      return numericAttributeColorScales.get(key)!(value);
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
      centralityKeyIndexMap: new Map(),
      attributeKeyIndexMap: new Map(),
    }),
}));
