import { type BinnedData } from "@/features/chart-filtering/components/createBinnedData";
import type {
  AttributeInfo,
  Centrality,
  Node,
  NodeAttributes,
  NodeAttributeValue,
  TimelineEntry,
} from "@/types/network";
import { flattenAttributes } from "@/utils/networkProcessing";
import { create } from "zustand";

type NodeMetrics = NodeAttributes & Partial<Centrality>;

export interface BrushRange {
  range: [number, number];
  inclusive: boolean;
}

interface MetricsStore {
  timestepMetricsData: Map<number, Map<string, NodeMetrics>>;
  timestepMetricsInfo: Map<number, Map<string, AttributeInfo>>;

  metricsData: Map<string, NodeMetrics>;
  filteredMetricsData: Map<string, NodeMetrics>;
  metricsKeys: string[];
  enabledMetricsKeys: string[];
  metricsInfo: Map<string, AttributeInfo>;

  brushRanges: Record<string, BrushRange | null>;
  binnedDataByKey: Map<string, BinnedData>;
  selectedCategories: Record<string, string[]>;

  currentTimestep: number | null;

  setMetricData: (nodes: Node[], centralities: Centrality[]) => void;
  precomputeAllTimesteps: (
    timesteps: number[],
    timelines: Map<string, TimelineEntry[]>,
    attributes: Map<string, NodeAttributes>,
    timelineCentralities: Map<number, Centrality[]>,
  ) => void;

  setCurrentTimestep: (timestep: number) => void;

  setEnabledMetricsKeys: (keys: string[]) => void;
  toggleMetricsKey: (key: string) => boolean;

  setBrushRange: (key: string, brushRange: BrushRange | null) => void;
  clearBrushRange: (key: string) => void;

  setBinnedData: (key: string, binnedData: BinnedData) => void;
  clearBinnedData: () => void;

  setSelectedCategories: (key: string, categories: string[]) => void;

  clearData: () => void;

  _updateFilteredMetricsData: () => void;
  updateFilters: () => void;
}

const filterAndMapMetricsData = (
  metricsData: Map<string, NodeMetrics>,
  enabledMetricsKeys: string[],
  brushRanges: Record<string, BrushRange | null>,
  selectedCategories: Record<string, string[]>,
) => {
  const filtered = new Map<string, NodeMetrics>();

  metricsData.forEach((metrics, id) => {
    const matches = enabledMetricsKeys.every((key) => {
      const value = metrics[key];

      const rangeObj = brushRanges[key];
      if (rangeObj && typeof value === "number") {
        const {
          range: [min, max],
          inclusive,
        } = rangeObj;
        const upperBoundCheck = inclusive ? value > max : value >= max;
        if (value < min || upperBoundCheck) return false;
      }

      const selected = selectedCategories[key];
      if (selected && selected.length > 0) {
        if (!selected.includes(String(value))) return false;
      }

      return true;
    });

    if (matches) {
      const result: NodeMetrics = {};
      for (const key of enabledMetricsKeys) {
        if (key in metrics) {
          result[key] = metrics[key];
        }
      }
      filtered.set(id, result);
    }
  });

  return filtered;
};

const computeMetricsInfo = (
  metricsData: Map<string, NodeMetrics>,
  centralityKeys: Set<string>,
): { keys: Set<string>; info: Map<string, AttributeInfo> } => {
  const metricsKeys = new Set<string>();
  const metricsInfo = new Map<string, AttributeInfo>();

  metricsData.forEach((metrics) => {
    Object.entries(metrics).forEach(([key, value]) => {
      if (key === "id") return;

      metricsKeys.add(key);

      if (!metricsInfo.has(key)) {
        metricsInfo.set(key, {
          key,
          type: "string",
          values: new Set<NodeAttributeValue>(),
          isNominal: false,
          isOrdinal: false,
          isNumeric: false,
          isBoolean: false,
          isCentrality: centralityKeys.has(key),
        });
      }

      const info = metricsInfo.get(key)!;
      info.values.add(value);

      if (typeof value === "number") {
        info.type = "number";
        info.isNumeric = true;
        if (!info.range) {
          info.range = { min: value, max: value };
        } else {
          info.range = {
            min: Math.min(info.range.min, value),
            max: Math.max(info.range.max, value),
          };
        }
      } else if (typeof value === "boolean") {
        info.type = "boolean";
        info.isBoolean = true;
      } else {
        info.type = "string";
      }
    });
  });

  metricsInfo.forEach((info) => {
    const uniqueCount = info.values.size;
    if (info.type === "string") {
      info.isNominal = uniqueCount <= 10;
      info.isOrdinal = false;
    } else if (info.type === "number") {
      const allIntegers = Array.from(info.values).every((v) =>
        Number.isInteger(Number(v)),
      );
      info.isNominal = allIntegers && uniqueCount <= 10;
      info.isOrdinal = allIntegers && uniqueCount > 1;
    } else if (info.type === "boolean") {
      info.isNominal = true;
      info.isOrdinal = false;
    }
  });

  return { keys: metricsKeys, info: metricsInfo };
};

const computeMetricsDataForTimestep = (
  timelines: Map<string, TimelineEntry[]>,
  timestep: number,
  staticAttributes: Map<string, NodeAttributes>,
  timelineCentralities: Map<number, Centrality[]>,
): { data: Map<string, NodeMetrics>; info: Map<string, AttributeInfo> } => {
  const metricsData = new Map<string, NodeMetrics>();
  const centralityKeys = new Set<string>();

  const activeNodeIds = new Set<string>();
  timelines.forEach((history, nodeId) => {
    if (history.some((h) => h.timestep === timestep)) {
      activeNodeIds.add(nodeId);
    }
  });

  staticAttributes.forEach((attrs, nodeId) => {
    if (activeNodeIds.has(nodeId)) {
      metricsData.set(nodeId, { ...attrs } as NodeMetrics);
    }
  });

  timelines.forEach((history, nodeId) => {
    const entry = history.find((h) => h.timestep === timestep);
    if (entry && entry.attributes) {
      const flattened = flattenAttributes(entry.attributes);
      const existing = metricsData.get(nodeId) || {};
      metricsData.set(nodeId, { ...existing, ...flattened });
    }
  });

  if (timelineCentralities) {
    const centralityData = timelineCentralities.get(timestep) ?? [];
    centralityData.forEach((centrality) => {
      const existing = metricsData.get(centrality.id) || {};
      const { id, ...centralityMetrics } = centrality;

      Object.keys(centralityMetrics).forEach((k) => centralityKeys.add(k));

      metricsData.set(centrality.id, { ...existing, ...centralityMetrics });
    });
  }

  const { info } = computeMetricsInfo(metricsData, centralityKeys);

  return { data: metricsData, info };
};

export const useMetricsStore = create<MetricsStore>((set, get) => ({
  timestepMetricsData: new Map(),
  timestepMetricsInfo: new Map(),
  metricsData: new Map(),
  metricsKeys: [],
  enabledMetricsKeys: [],
  metricsInfo: new Map(),
  brushRanges: {},
  binnedDataByKey: new Map(),
  selectedCategories: {},
  filteredMetricsData: new Map<string, NodeMetrics>(),
  currentTimestep: null,

  setMetricData: (nodes, centralities) => {
    const metricsData = new Map<string, NodeMetrics>();
    const centralityKeys = new Set<string>();

    nodes.forEach((node) => {
      if (node.attributes) {
        const flattenedAttrs = flattenAttributes(node.attributes);
        metricsData.set(node.id, flattenedAttrs);
      }
    });

    if (centralities) {
      centralities.forEach((centrality) => {
        const existing = metricsData.get(centrality.id) || {};
        const { id, ...centralityMetrics } = centrality;

        Object.keys(centralityMetrics).forEach((k) => centralityKeys.add(k));

        metricsData.set(centrality.id, { ...existing, ...centralityMetrics });
      });
    }

    const { keys, info } = computeMetricsInfo(metricsData, centralityKeys);
    const metricsKeysArray = Array.from(keys);

    set({
      metricsData,
      metricsKeys: metricsKeysArray,
      metricsInfo: info,
      enabledMetricsKeys: metricsKeysArray,
    });

    get()._updateFilteredMetricsData();
  },

  precomputeAllTimesteps: (
    timesteps,
    timelines,
    attributes,
    timelineCentralities,
  ) => {
    const timestepMetricsData = new Map<number, Map<string, NodeMetrics>>();
    const timestepMetricsInfo = new Map<number, Map<string, AttributeInfo>>();

    const allMetricsData = new Map<string, NodeMetrics>();
    const centralityKeys = new Set<string>();

    timesteps.forEach((timestep) => {
      const { data, info } = computeMetricsDataForTimestep(
        timelines,
        timestep,
        attributes,
        timelineCentralities,
      );
      timestepMetricsData.set(timestep, data);
      timestepMetricsInfo.set(timestep, info);

      info.forEach((attrInfo, key) => {
        if (attrInfo.isCentrality) {
          centralityKeys.add(key);
        }
      });

      data.forEach((metrics, nodeId) => {
        const existing = allMetricsData.get(nodeId) || {};
        allMetricsData.set(nodeId, { ...existing, ...metrics });
      });
    });

    const { info: unifiedClassification } = computeMetricsInfo(
      allMetricsData,
      centralityKeys,
    );

    timestepMetricsInfo.forEach((timestepInfo) => {
      timestepInfo.forEach((info, key) => {
        const unified = unifiedClassification.get(key);
        if (unified) {
          info.type = unified.type;
          info.isNominal = unified.isNominal;
          info.isOrdinal = unified.isOrdinal;
          info.isNumeric = unified.isNumeric;
          info.isBoolean = unified.isBoolean;
        }
      });
    });

    set({
      timestepMetricsData,
      timestepMetricsInfo,
    });

    if (timesteps.length > 0) {
      get().setCurrentTimestep(timesteps[0]);
    }
  },

  setCurrentTimestep: (timestep) => {
    const { timestepMetricsData, timestepMetricsInfo } = get();

    const metricsData = timestepMetricsData.get(timestep);
    const metricsInfo = timestepMetricsInfo.get(timestep);

    if (!metricsData || !metricsInfo) {
      console.warn(`No precomputed data for timestep ${timestep}`);
      return;
    }

    const metricsKeysArray = Array.from(metricsInfo.keys());

    set({
      currentTimestep: timestep,
      metricsData,
      metricsInfo,
      metricsKeys: metricsKeysArray,
      enabledMetricsKeys: metricsKeysArray,
    });

    get()._updateFilteredMetricsData();
  },

  setEnabledMetricsKeys: (keys) => {
    set({ enabledMetricsKeys: keys });
    get()._updateFilteredMetricsData();
  },

  toggleMetricsKey: (key) => {
    let removed = false;
    set((s) => {
      const isEnabled = s.enabledMetricsKeys.includes(key);
      if (isEnabled) {
        removed = true;
        return {
          enabledMetricsKeys: s.enabledMetricsKeys.filter((k) => k !== key),
        };
      } else {
        return {
          enabledMetricsKeys: s.metricsKeys.filter(
            (k) => k === key || s.enabledMetricsKeys.includes(k),
          ),
        };
      }
    });
    get()._updateFilteredMetricsData();
    return removed;
  },

  setSelectedCategories: (key, categories) => {
    set((state) => ({
      selectedCategories: {
        ...state.selectedCategories,
        [key]: categories,
      },
    }));
    get()._updateFilteredMetricsData();
  },

  _updateFilteredMetricsData: () => {
    const state = get();
    const filtered = filterAndMapMetricsData(
      state.metricsData,
      state.enabledMetricsKeys,
      state.brushRanges,
      state.selectedCategories,
    );
    set({ filteredMetricsData: filtered });
  },

  updateFilters: () => {
    get()._updateFilteredMetricsData();
  },

  setBrushRange: (key, brushRange) => {
    set((s) => {
      const newBrushRanges = {
        ...s.brushRanges,
        [key]: brushRange,
      };

      const filtered = filterAndMapMetricsData(
        s.metricsData,
        s.enabledMetricsKeys,
        newBrushRanges,
        s.selectedCategories,
      );

      return {
        brushRanges: newBrushRanges,
        filteredMetricsData: filtered,
      };
    });
  },

  clearBrushRange: (key) => {
    set((s) => {
      const newBrushRanges = { ...s.brushRanges, [key]: null };
      const filtered = filterAndMapMetricsData(
        s.metricsData,
        s.enabledMetricsKeys,
        newBrushRanges,
        s.selectedCategories,
      );
      return {
        brushRanges: newBrushRanges,
        filteredMetricsData: filtered,
      };
    });
  },

  setBinnedData: (key, binnedData) => {
    set((s) => {
      const newMap = new Map(s.binnedDataByKey);
      newMap.set(key, binnedData);
      return { binnedDataByKey: newMap };
    });
  },

  clearBinnedData: () => {
    set({ binnedDataByKey: new Map() });
  },

  clearData: () =>
    set({
      timestepMetricsData: new Map(),
      timestepMetricsInfo: new Map(),
      metricsData: new Map(),
      metricsKeys: [],
      enabledMetricsKeys: [],
      metricsInfo: new Map(),
      brushRanges: {},
      binnedDataByKey: new Map(),
      selectedCategories: {},
      filteredMetricsData: new Map(),
      currentTimestep: null,
    }),
}));
