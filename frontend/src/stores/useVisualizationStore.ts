import type { AttributeInfo, AttributeValue } from "@/types/network";
import * as d3 from "d3";
import { create } from "zustand";

interface VisualizationStore {
  centralityColors: Map<string, string>;
  attributeColors: Map<string, string>;
  categoryColors: Map<string, string>;

  categoryCounter: number;
  set1Counter: number;
  pairedCounter: number;
  category10Counter: number;

  initializeColors: (metricsInfo: Map<string, AttributeInfo>) => void;
  getOrAssignCentralityColor: (key: string) => string;
  getOrAssignAttributeColor: (key: string) => string;
  getOrAssignCategoryColor: (key: string, value: AttributeValue) => string;

  clearData: () => void;
}

//Custom with colors from color brewer and kellys. Should be quite distinct
const distinctColors = [
  "#e6194b",
  "#3cb44b",
  "#ffe119",
  "#4363d8",
  "#f58231",
  "#911eb4",
  "#6f340d",
  "#46f0f0",
  "#f032e6",
  "#bcf60c",
  "#fabebe",
  "#008080",
  "#e6beff",
  "#9a6324",
  "#aaffc3",
  "#808000",
  "#ffd8b1",
  "#ff6b6b",
  "#fd79a8",
  "#4ecdc4",
  "#fdcb6e",
  "#6c5ce7",
  "#00b894",
  "#e17055",
  "#74b9ff",
  "#DCD300",
];

// https://eleanormaclure.wordpress.com/wp-content/uploads/2011/03/colour-coding.pdf
// const colorPalette = [
//   "#fdfdfd",
//   "#1d1d1d",
//   "#e6194b",
//   "#3cb44b",
//   "#ebce2b",
//   "#702c8c",
//   "#db6917",
//   "#96cde6",
//   "#ba1c30",
//   "#c0bd7f",
//   "#7f7e80",
//   "#5fa641",
//   "#d485b2",
//   "#4277b6",
//   "#df8461",
//   "#463397",
//   "#e1a11a",
//   "#92ae31",
//   "#91218c",
//   "#e8e948",
//   "#7e1510",
//   "#6f340d",
//   "#d32b1e",
//   "#2b3514",
// ];

export const useVisualizationStore = create<VisualizationStore>((set, get) => ({
  centralityColors: new Map(),
  attributeColors: new Map(),
  categoryColors: new Map(),
  categoryCounter: 0,
  set1Counter: 0,
  pairedCounter: 0,
  category10Counter: 0,

  initializeColors: (metricsInfo: Map<string, AttributeInfo>) => {
    const centralityColors = new Map<string, string>();
    const attributeColors = new Map<string, string>();
    const categoryColors = new Map<string, string>();

    const centralityKeys: string[] = [];
    const attributeKeys: string[] = [];
    const categoricalKeys: string[] = [];

    metricsInfo.forEach((info, key) => {
      if (info.isCentrality) {
        centralityKeys.push(key);
      } else if (info.isCategory) {
        categoricalKeys.push(key);
      } else {
        attributeKeys.push(key);
      }
    });

    centralityKeys.forEach((key, index) => {
      const color = distinctColors[index % distinctColors.length];
      centralityColors.set(key, color);
    });

    const numAttributes = attributeKeys.length;
    attributeKeys.forEach((key, index) => {
      const t = numAttributes > 1 ? index / (numAttributes - 1) : 0.5;
      const color = d3.interpolateCool(t);
      attributeColors.set(key, color);
    });

    const palettes = [
      d3.schemeCategory10,
      d3.schemePaired,
      [...d3.schemeSet1, "#8B4513"] as string[],
    ];

    let paletteCounters = [0, 0, 0];

    categoricalKeys.forEach((key, attributeIndex) => {
      const info = metricsInfo.get(key);
      if (info) {
        const paletteIndex = attributeIndex % 3;
        const palette = palettes[paletteIndex];
        const startIndex = paletteCounters[paletteIndex];

        Array.from(info.values).forEach((value, valueIndex) => {
          const colorIndex = (startIndex + valueIndex) % palette.length;
          const color = palette[colorIndex];
          categoryColors.set(`${key}:${value}`, color);
        });

        paletteCounters[paletteIndex] += info.values.size;
      }
    });

    set({
      centralityColors,
      attributeColors,
      categoryColors,
      categoryCounter: categoricalKeys.length,
      category10Counter: paletteCounters[0],
      pairedCounter: paletteCounters[1],
      set1Counter: paletteCounters[2],
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
    const {
      categoryColors,
      categoryCounter,
      set1Counter,
      pairedCounter,
      category10Counter,
    } = get();
    const categoryKey = `${key}:${value}`;

    if (categoryColors.has(categoryKey)) {
      return categoryColors.get(categoryKey)!;
    }

    const existingValuesForKey = Array.from(categoryColors.keys()).filter((k) =>
      k.startsWith(`${key}:`),
    ).length;
    const isFirstValueForKey = existingValuesForKey === 0;

    const paletteIndex = categoryCounter % 3;
    const set1Extended = [...d3.schemeSet1, "#8B4513"] as string[];

    let palette: readonly string[];
    let currentCounter: number;

    if (paletteIndex === 0) {
      palette = d3.schemeCategory10;
      currentCounter = category10Counter;
    } else if (paletteIndex === 1) {
      palette = d3.schemePaired;
      currentCounter = pairedCounter;
    } else {
      palette = set1Extended;
      currentCounter = set1Counter;
    }

    const colorIndex = (currentCounter + existingValuesForKey) % palette.length;
    const color = palette[colorIndex];

    set((state) => ({
      categoryColors: new Map(state.categoryColors).set(categoryKey, color),
      categoryCounter: isFirstValueForKey
        ? state.categoryCounter + 1
        : state.categoryCounter,
      category10Counter:
        paletteIndex === 0 && isFirstValueForKey
          ? state.category10Counter + existingValuesForKey + 1
          : state.category10Counter,
      pairedCounter:
        paletteIndex === 1 && isFirstValueForKey
          ? state.pairedCounter + existingValuesForKey + 1
          : state.pairedCounter,
      set1Counter:
        paletteIndex === 2 && isFirstValueForKey
          ? state.set1Counter + existingValuesForKey + 1
          : state.set1Counter,
    }));

    return color;
  },

  clearData: () =>
    set({
      centralityColors: new Map(),
      attributeColors: new Map(),
      categoryColors: new Map(),
      categoryCounter: 0,
      set1Counter: 0,
      pairedCounter: 0,
      category10Counter: 0,
    }),
}));
