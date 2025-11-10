import { type BinnedData } from "@/features/chart-filtering/components/createBinnedData";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import type {
  AttributeInfo,
  AttributeRecord,
  Attributes,
  AttributeValue,
  Node,
  TimelineEntry,
} from "@/types/network";
import { flattenAttributes } from "@/utils/networkProcessing";
import { create } from "zustand";

export interface BrushRange {
  range: [number, number];
  inclusive: boolean;
}

interface MetricsStore {
  timestepMetricsData: Map<number, Map<string, Attributes>>;
  timestepMetricsInfo: Map<number, Map<string, AttributeInfo>>;
  metricsData: Map<string, Attributes>;
  metricsKeys: string[];
  enabledMetricsKeys: string[];

  timestepEdgeMetricsData: Map<number, Map<string, Attributes>>;
  edgeMetricsData: Map<string, Attributes>;
  edgeMetricsKeys: string[];
  enabledEdgeMetricsKeys: string[];

  metricsInfo: Map<string, AttributeInfo>;

  brushRanges: Record<string, BrushRange | null>;
  binnedDataByKey: Map<string, BinnedData>;
  selectedCategories: Record<string, string[]>;

  currentTimestep: number | null;

  setMetricData: (
    nodes: Node[],
    nodeCentralities: AttributeRecord[],
    edgeCentralities: AttributeRecord[],
    nodeCentralityKeys: Set<string>,
    edgeCentralityKeys: Set<string>,
  ) => void;

  precomputeAllTimesteps: (
    timesteps: number[],
    timelines: Map<string, TimelineEntry[]>,
    attributes: Map<string, Attributes>,
    timelineNodeCentralities: Map<number, AttributeRecord[]>,
    timelineEdgeCentralities: Map<number, AttributeRecord[]>,
    nodeCentralityKeys: Set<string>,
    edgeCentralityKeys: Set<string>,
  ) => void;

  setCurrentTimestep: (timestep: number) => void;

  setEnabledMetricsKeys: (keys: string[]) => void;
  toggleMetricsKey: (key: string) => boolean;

  setEnabledEdgeMetricsKeys: (keys: string[]) => void;
  toggleEdgeMetricsKey: (key: string) => boolean;

  setBrushRange: (key: string, brushRange: BrushRange | null) => void;
  clearBrushRange: (key: string) => void;

  setBinnedData: (key: string, binnedData: BinnedData) => void;
  clearBinnedData: () => void;

  setSelectedCategories: (key: string, categories: string[]) => void;

  getColorForMetric: (key: string, value?: AttributeValue) => string;

  clearData: () => void;
}

const computeMetricsInfo = (
  metricsData: Map<string, Attributes>,
  centralityKeys: Set<string>,
): { keys: Set<string>; info: Map<string, AttributeInfo> } => {
  const metricsKeys = new Set<string>();
  const metricsInfo = new Map<string, AttributeInfo>();

  metricsData.forEach((metrics) => {
    Object.entries(metrics).forEach(([key, value]) => {
      metricsKeys.add(key);

      if (!metricsInfo.has(key)) {
        metricsInfo.set(key, {
          key,
          type: "string",
          values: new Set<AttributeValue>(),
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
  staticAttributes: Map<string, Attributes>,
  timelineNodeCentralities: Map<number, AttributeRecord[]>,
  timelineEdgeCentralities: Map<number, AttributeRecord[]>,
  nodeCentralityKeys: Set<string>,
  edgeCentralityKeys: Set<string>,
): {
  nodeData: Map<string, Attributes>;
  edgeData: Map<string, Attributes>;
  unifiedInfo: Map<string, AttributeInfo>;
} => {
  const nodeMetricsData = new Map<string, Attributes>();
  const edgeMetricsData = new Map<string, Attributes>();

  const activeNodeIds = new Set<string>();
  timelines.forEach((history, nodeId) => {
    if (history.some((h) => h.timestep === timestep)) {
      activeNodeIds.add(nodeId);
    }
  });

  staticAttributes.forEach((attrs, nodeId) => {
    if (activeNodeIds.has(nodeId)) {
      nodeMetricsData.set(nodeId, { ...attrs });
    }
  });

  timelines.forEach((history, nodeId) => {
    const entry = history.find((h) => h.timestep === timestep);
    if (entry && entry.attributes) {
      const flattened = flattenAttributes(entry.attributes);
      const existing = nodeMetricsData.get(nodeId) || {};
      nodeMetricsData.set(nodeId, { ...existing, ...flattened });
    }
  });

  if (timelineNodeCentralities) {
    const nodeCentralityData = timelineNodeCentralities.get(timestep) ?? [];
    nodeCentralityData.forEach((centrality) => {
      const existing = nodeMetricsData.get(centrality.id) || {};
      nodeMetricsData.set(centrality.id, {
        ...centrality.attributes,
        ...existing,
      });
    });
  }

  if (timelineEdgeCentralities) {
    const edgeCentralityData = timelineEdgeCentralities.get(timestep) ?? [];
    edgeCentralityData.forEach((centrality) => {
      edgeMetricsData.set(centrality.id, centrality.attributes);
    });
  }

  const { info: nodeInfo } = computeMetricsInfo(
    nodeMetricsData,
    nodeCentralityKeys,
  );
  const { info: edgeInfo } = computeMetricsInfo(
    edgeMetricsData,
    edgeCentralityKeys,
  );

  const unifiedInfo = new Map<string, AttributeInfo>();
  nodeInfo.forEach((info, key) => unifiedInfo.set(key, info));
  edgeInfo.forEach((info, key) => unifiedInfo.set(key, info));

  return {
    nodeData: nodeMetricsData,
    edgeData: edgeMetricsData,
    unifiedInfo,
  };
};

export const useMetricsStore = create<MetricsStore>((set, get) => ({
  timestepMetricsData: new Map(),
  timestepMetricsInfo: new Map(),
  metricsData: new Map(),
  metricsKeys: [],
  enabledMetricsKeys: [],

  timestepEdgeMetricsData: new Map(),
  edgeMetricsData: new Map(),
  edgeMetricsKeys: [],
  enabledEdgeMetricsKeys: [],

  metricsInfo: new Map(),

  brushRanges: {},
  binnedDataByKey: new Map(),
  selectedCategories: {},
  currentTimestep: null,

  setMetricData: (
    nodes,
    nodeCentralities,
    edgeCentralities,
    nodeCentralityKeys,
    edgeCentralityKeys,
  ) => {
    const nodeMetricsData = new Map<string, Attributes>();
    const edgeMetricsData = new Map<string, Attributes>();

    nodes.forEach((node) => {
      if (node.attributes) {
        const flattenedAttrs = flattenAttributes(node.attributes);
        nodeMetricsData.set(node.id, flattenedAttrs);
      }
    });

    if (nodeCentralities) {
      nodeCentralities.forEach((centrality) => {
        const existing = nodeMetricsData.get(centrality.id) || {};
        nodeMetricsData.set(centrality.id, {
          ...existing,
          ...centrality.attributes,
        });
      });
    }

    if (edgeCentralities) {
      edgeCentralities.forEach((centrality) => {
        edgeMetricsData.set(centrality.id, centrality.attributes);
      });
    }

    const { keys: nodeKeys, info: nodeInfo } = computeMetricsInfo(
      nodeMetricsData,
      nodeCentralityKeys,
    );
    const { keys: edgeKeys, info: edgeInfo } = computeMetricsInfo(
      edgeMetricsData,
      edgeCentralityKeys,
    );

    const unifiedInfo = new Map<string, AttributeInfo>();
    nodeInfo.forEach((info, key) => unifiedInfo.set(key, info));
    edgeInfo.forEach((info, key) => unifiedInfo.set(key, info));

    const nodeMetricsKeysArray = Array.from(nodeKeys);
    const edgeMetricsKeysArray = Array.from(edgeKeys);

    const brushRanges: Record<string, BrushRange | null> = {};
    [...nodeMetricsKeysArray, ...edgeMetricsKeysArray].forEach((key) => {
      brushRanges[key] = null;
    });

    useVisualizationStore.getState().initializeColors(unifiedInfo);

    set({
      metricsData: nodeMetricsData,
      metricsKeys: nodeMetricsKeysArray,
      metricsInfo: unifiedInfo,
      enabledMetricsKeys: nodeMetricsKeysArray,
      edgeMetricsData,
      edgeMetricsKeys: edgeMetricsKeysArray,
      enabledEdgeMetricsKeys: edgeMetricsKeysArray,
      brushRanges,
    });
  },

  precomputeAllTimesteps: (
    timesteps,
    timelines,
    attributes,
    timelineNodeCentralities,
    timelineEdgeCentralities,
    nodeCentralityKeys,
    edgeCentralityKeys,
  ) => {
    const timestepMetricsData = new Map<number, Map<string, Attributes>>();
    const timestepMetricsInfo = new Map<number, Map<string, AttributeInfo>>();
    const timestepEdgeMetricsData = new Map<number, Map<string, Attributes>>();

    const allNodeMetricsData = new Map<string, Attributes>();
    const allEdgeMetricsData = new Map<string, Attributes>();

    timesteps.forEach((timestep) => {
      const { nodeData, edgeData, unifiedInfo } = computeMetricsDataForTimestep(
        timelines,
        timestep,
        attributes,
        timelineNodeCentralities,
        timelineEdgeCentralities,
        nodeCentralityKeys,
        edgeCentralityKeys,
      );

      timestepMetricsData.set(timestep, nodeData);
      timestepEdgeMetricsData.set(timestep, edgeData);
      timestepMetricsInfo.set(timestep, unifiedInfo);

      nodeData.forEach((metrics, nodeId) => {
        const existing = allNodeMetricsData.get(nodeId) || {};
        allNodeMetricsData.set(nodeId, { ...existing, ...metrics });
      });

      edgeData.forEach((metrics, edgeId) => {
        const existing = allEdgeMetricsData.get(edgeId) || {};
        allEdgeMetricsData.set(edgeId, { ...existing, ...metrics });
      });
    });

    const { info: nodeClassification } = computeMetricsInfo(
      allNodeMetricsData,
      nodeCentralityKeys,
    );
    const { info: edgeClassification } = computeMetricsInfo(
      allEdgeMetricsData,
      edgeCentralityKeys,
    );

    const unifiedClassification = new Map<string, AttributeInfo>();
    nodeClassification.forEach((info, key) =>
      unifiedClassification.set(key, info),
    );
    edgeClassification.forEach((info, key) =>
      unifiedClassification.set(key, info),
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

    useVisualizationStore.getState().initializeColors(unifiedClassification);

    set({
      timestepMetricsData,
      timestepMetricsInfo,
      timestepEdgeMetricsData,
    });

    if (timesteps.length > 0) {
      get().setCurrentTimestep(timesteps[0]);
    }
  },

  setCurrentTimestep: (timestep) => {
    const {
      timestepMetricsData,
      timestepMetricsInfo,
      timestepEdgeMetricsData,
      brushRanges: existingBrushRanges,
    } = get();

    const metricsData = timestepMetricsData.get(timestep);
    const unifiedInfo = timestepMetricsInfo.get(timestep);
    const edgeMetricsData = timestepEdgeMetricsData.get(timestep);

    if (!metricsData || !unifiedInfo) {
      console.warn(`No precomputed data for timestep ${timestep}`);
      return;
    }

    const nodeMetricsKeys = new Set<string>();
    const edgeMetricsKeys = new Set<string>();

    metricsData.forEach((metrics) => {
      Object.keys(metrics).forEach((key) => nodeMetricsKeys.add(key));
    });

    if (edgeMetricsData) {
      edgeMetricsData.forEach((metrics) => {
        Object.keys(metrics).forEach((key) => edgeMetricsKeys.add(key));
      });
    }

    const metricsKeysArray = Array.from(nodeMetricsKeys);
    const edgeMetricsKeysArray = Array.from(edgeMetricsKeys);

    const brushRanges: Record<string, BrushRange | null> = {
      ...existingBrushRanges,
    };
    [...metricsKeysArray, ...edgeMetricsKeysArray].forEach((key) => {
      if (!(key in brushRanges)) {
        brushRanges[key] = null;
      }
    });

    set({
      currentTimestep: timestep,
      metricsData,
      metricsInfo: unifiedInfo,
      metricsKeys: metricsKeysArray,
      enabledMetricsKeys: metricsKeysArray,
      edgeMetricsData: edgeMetricsData || new Map(),
      edgeMetricsKeys: edgeMetricsKeysArray,
      enabledEdgeMetricsKeys: edgeMetricsKeysArray,
      brushRanges,
    });
  },

  setEnabledMetricsKeys: (keys) => {
    set({ enabledMetricsKeys: keys });
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
    return removed;
  },

  setEnabledEdgeMetricsKeys: (keys) => {
    set({ enabledEdgeMetricsKeys: keys });
  },

  toggleEdgeMetricsKey: (key) => {
    let removed = false;
    set((s) => {
      const isEnabled = s.enabledEdgeMetricsKeys.includes(key);
      if (isEnabled) {
        removed = true;
        return {
          enabledEdgeMetricsKeys: s.enabledEdgeMetricsKeys.filter(
            (k) => k !== key,
          ),
        };
      } else {
        return {
          enabledEdgeMetricsKeys: s.edgeMetricsKeys.filter(
            (k) => k === key || s.enabledEdgeMetricsKeys.includes(k),
          ),
        };
      }
    });
    return removed;
  },

  setSelectedCategories: (key, categories) => {
    set((state) => ({
      selectedCategories: {
        ...state.selectedCategories,
        [key]: categories,
      },
    }));
  },

  setBrushRange: (key, brushRange) => {
    set((s) => ({
      brushRanges: {
        ...s.brushRanges,
        [key]: brushRange,
      },
    }));
  },

  clearBrushRange: (key) => {
    set((s) => ({
      brushRanges: { ...s.brushRanges, [key]: null },
    }));
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

  getColorForMetric: (key: string, value?: AttributeValue) => {
    const { metricsInfo } = get();
    const info = metricsInfo.get(key);

    if (!info) {
      return "var(--muted-foreground)";
    }

    const vizStore = useVisualizationStore.getState();

    if (info.isCentrality) {
      return vizStore.getOrAssignCentralityColor(key);
    }

    if ((info.isNominal || info.isBoolean) && value !== undefined) {
      return vizStore.getOrAssignCategoryColor(key, value);
    }

    return vizStore.getOrAssignAttributeColor(key);
  },

  clearData: () =>
    set({
      timestepMetricsData: new Map(),
      timestepMetricsInfo: new Map(),
      timestepEdgeMetricsData: new Map(),
      metricsData: new Map(),
      metricsKeys: [],
      enabledMetricsKeys: [],
      metricsInfo: new Map(),
      edgeMetricsData: new Map(),
      edgeMetricsKeys: [],
      enabledEdgeMetricsKeys: [],
      brushRanges: {},
      binnedDataByKey: new Map(),
      selectedCategories: {},
      currentTimestep: null,
    }),
}));
