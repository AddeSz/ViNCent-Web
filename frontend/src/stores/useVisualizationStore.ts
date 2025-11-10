import type { AttributeInfo, AttributeValue } from "@/types/network";
import * as d3 from "d3";
import { create } from "zustand";

interface VisualizationStore {
  centralityColors: Map<string, string>;
  attributeColors: Map<string, string>;
  categoryColors: Map<string, string>;

  categoryCounter: number;

  combinedCategoryPalette: string[];

  initializeColors: (metricsInfo: Map<string, AttributeInfo>) => void;
  getOrAssignCentralityColor: (key: string) => string;
  getOrAssignAttributeColor: (key: string) => string;
  getOrAssignCategoryColor: (key: string, value: AttributeValue) => string;

  clearData: () => void;
}

const createCombinedPalette = (): string[] => {
  const paired = d3.schemePaired;
  const set3 = d3.schemeSet3;
  const combined: string[] = [];
  const maxLength = Math.max(paired.length, set3.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < paired.length) combined.push(paired[i]);
    if (i < set3.length) combined.push(set3[i]);
  }

  return combined;
};

export const useVisualizationStore = create<VisualizationStore>((set, get) => ({
  centralityColors: new Map(),
  attributeColors: new Map(),
  categoryColors: new Map(),
  categoryCounter: 0,
  combinedCategoryPalette: createCombinedPalette(),

  initializeColors: (metricsInfo: Map<string, AttributeInfo>) => {
    const centralityColors = new Map<string, string>();
    const attributeColors = new Map<string, string>();

    const centralityKeys: string[] = [];
    const attributeKeys: string[] = [];

    metricsInfo.forEach((info, key) => {
      if (info.isCentrality) {
        centralityKeys.push(key);
      } else if (!info.isNominal && !info.isBoolean) {
        attributeKeys.push(key);
      }
    });

    const numCentrality = centralityKeys.length;
    centralityKeys.forEach((key, index) => {
      const t = numCentrality > 1 ? index / (numCentrality - 1) : 0.5;
      const color = d3.interpolateSpectral(t);
      centralityColors.set(key, color);
    });

    const numAttributes = attributeKeys.length;
    attributeKeys.forEach((key, index) => {
      const t = numAttributes > 1 ? index / (numAttributes - 1) : 0.5;
      const color = d3.interpolateCool(t);
      attributeColors.set(key, color);
    });

    set({
      centralityColors,
      attributeColors,
      categoryCounter: 0,
    });
  },

  getOrAssignCentralityColor: (key: string) => {
    const { centralityColors } = get();

    if (centralityColors.has(key)) {
      return centralityColors.get(key)!;
    }

    const numExisting = centralityColors.size;
    const t = (numExisting % 100) / 99;
    const color = d3.interpolateSpectral(t);

    set((state) => ({
      centralityColors: new Map(state.centralityColors).set(key, color),
    }));

    return color;
  },

  getOrAssignAttributeColor: (key: string) => {
    const { attributeColors } = get();

    if (attributeColors.has(key)) {
      return attributeColors.get(key)!;
    }

    const numExisting = attributeColors.size;
    const t = (numExisting % 100) / 99;
    const color = d3.interpolateCool(t);

    set((state) => ({
      attributeColors: new Map(state.attributeColors).set(key, color),
    }));

    return color;
  },

  getOrAssignCategoryColor: (key: string, value: AttributeValue) => {
    const { categoryColors, categoryCounter, combinedCategoryPalette } = get();
    const categoryKey = `${key}:${value}`;

    if (categoryColors.has(categoryKey)) {
      return categoryColors.get(categoryKey)!;
    }

    const color =
      combinedCategoryPalette[categoryCounter % combinedCategoryPalette.length];

    set((state) => ({
      categoryColors: new Map(state.categoryColors).set(categoryKey, color),
      categoryCounter: state.categoryCounter + 1,
    }));

    return color;
  },

  clearData: () =>
    set({
      centralityColors: new Map(),
      attributeColors: new Map(),
      categoryColors: new Map(),
      categoryCounter: 0,
    }),
}));
