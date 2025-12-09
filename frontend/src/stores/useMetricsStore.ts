import { type BinnedData } from "@/features/chart-filtering/components/createBinnedData";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import type {
  AttributeInfo,
  Attributes,
  AttributeValue,
  Edge,
  Network,
  Node,
  TimestepDelta,
} from "@/types/network";
import { create } from "zustand";

export interface BrushRange {
  range: [number, number];
  inclusive: boolean;
}

export interface CentralityData {
  nodes: Record<string, Record<string, number>>;
  edges: Record<string, Record<string, number>>;
}

interface MetricsStore {
  nodeMetricsKeys: string[];
  enabledMetricsKeys: string[];

  disabledNodeMetricsKeys: Set<string>;
  disabledEdgeMetricsKeys: Set<string>;

  edgeMetricsKeys: string[];
  enabledEdgeMetricsKeys: string[];

  currentNodes: Map<string, Node>;
  currentEdges: Map<string, Edge>;
  baseState: Network | null;
  deltas: Map<number, TimestepDelta>;
  centralities: Map<number, CentralityData>;

  metricsInfo: Map<string, AttributeInfo>;
  metricsInfoCurrent: Map<string, AttributeInfo>;

  brushRanges: Record<string, BrushRange | null>;
  selectedCategories: Record<string, string[]>;
  binnedDataByKey: Map<string, BinnedData>;

  disabledValues: Record<string, Set<number | string>>;

  timesteps: number[];
  currentTimestep: number | null;

  setTimesteps: (timesteps: number[]) => void;
  setTimestep: (timestep: number) => void;

  loadDeltaBasedNetwork: (
    baseState: Network,
    deltas: Record<number, TimestepDelta>,
    centralities: Record<number, CentralityData>,
    metricsInfo: Record<string, AttributeInfo>,
  ) => void;

  applyDeltaAndSetTimestep: (timestep: number) => void;

  setEnabledMetricsKeys: (keys: string[]) => void;
  setEnabledEdgeMetricsKeys: (keys: string[]) => void;
  toggleMetricsKey: (key: string) => boolean;

  setBrushRange: (key: string, brushRange: BrushRange | null) => void;
  setSelectedCategories: (key: string, categories: string[]) => void;
  clearBrushRange: (key: string) => void;

  setBinnedData: (key: string, binnedData: BinnedData) => void;
  clearBinnedData: () => void;

  setDisabledValues: (key: string, values: Set<number | string>) => void;
  clearDisabledValues: (key: string) => void;

  getColorForMetric: (key: string, value?: AttributeValue) => string;

  clearData: () => void;
}

const computeCurrentMetricsInfo = (
  metricsData: Map<string, Attributes>,
): Map<
  string,
  { values: Set<AttributeValue>; range?: { min: number; max: number } }
> => {
  const currentInfo = new Map<
    string,
    { values: Set<AttributeValue>; range?: { min: number; max: number } }
  >();

  metricsData.forEach((metrics) => {
    Object.entries(metrics).forEach(([key, value]) => {
      if (!currentInfo.has(key)) {
        currentInfo.set(key, {
          values: new Set<AttributeValue>(),
          range: undefined,
        });
      }

      const info = currentInfo.get(key)!;
      info.values.add(value);

      if (typeof value === "number") {
        if (!info.range) {
          info.range = { min: value, max: value };
        } else {
          info.range.min = Math.min(info.range.min, value);
          info.range.max = Math.max(info.range.max, value);
        }
      }
    });
  });

  return currentInfo;
};

function applyDelta(
  currentNodes: Map<string, Node>,
  currentEdges: Map<string, Edge>,
  delta: TimestepDelta,
) {
  delta.nodes_added.forEach((node) => {
    currentNodes.set(node.id, { ...node });
  });

  delta.nodes_removed.forEach((nodeId) => {
    currentNodes.delete(nodeId);
  });

  Object.entries(delta.nodes_attr_changed).forEach(([nodeId, attrChanges]) => {
    const node = currentNodes.get(nodeId);
    if (node) {
      node.attributes = { ...node.attributes, ...attrChanges };

      if ("label" in attrChanges) {
        node.label = attrChanges._label as string;
      }
    }
  });

  delta.edges_added.forEach((edge) => {
    currentEdges.set(edge.id, { ...edge });
  });

  delta.edges_removed.forEach((edgeId) => {
    currentEdges.delete(edgeId);
  });

  Object.entries(delta.edges_attr_changed).forEach(([edgeId, attrChanges]) => {
    const edge = currentEdges.get(edgeId);
    if (edge) {
      edge.attributes = { ...edge.attributes, ...attrChanges };

      if ("weight" in attrChanges) {
        edge.weight = attrChanges._weight as number;
      }
    }
  });
}

export const useMetricsStore = create<MetricsStore>((set, get) => ({
  nodeMetricsKeys: [],
  enabledMetricsKeys: [],

  disabledNodeMetricsKeys: new Set(),
  disabledEdgeMetricsKeys: new Set(),

  edgeMetricsKeys: [],
  enabledEdgeMetricsKeys: [],

  currentNodes: new Map(),
  currentEdges: new Map(),
  baseState: null,
  deltas: new Map(),
  centralities: new Map(),

  metricsInfo: new Map(),
  metricsInfoCurrent: new Map(),

  brushRanges: {},
  selectedCategories: {},
  binnedDataByKey: new Map(),

  disabledValues: {},

  timesteps: [],
  currentTimestep: null,

  setTimesteps: (timesteps) => {
    set({ timesteps });

    if (timesteps.length > 0) {
      const firstTimestep = Math.min(...timesteps);
      get().setTimestep(firstTimestep);
    }
  },

  setTimestep: (timestep) => {
    const { deltas } = get();

    if (deltas.size > 0) {
      get().applyDeltaAndSetTimestep(timestep);
    } else {
      set({ currentTimestep: timestep });
    }
  },

  loadDeltaBasedNetwork: (baseState, deltas, centralities, metricsInfo) => {
    const deltasMap = new Map(
      Object.entries(deltas).map(([k, v]) => [Number(k), v]),
    );

    const centralitiesMap = new Map(
      Object.entries(centralities).map(([k, v]) => [Number(k), v]),
    );

    const timesteps = Array.from(deltasMap.keys()).sort((a, b) => a - b);

    const unifiedInfo = new Map<string, AttributeInfo>();
    Object.entries(metricsInfo).forEach(([key, info]) => {
      unifiedInfo.set(key, {
        ...info,
        values: new Set(info.values),
      });
    });

    useVisualizationStore.getState().initializeColors(unifiedInfo);
    console.log("Metrics info from backend:", unifiedInfo);

    set({
      baseState,
      deltas: deltasMap,
      centralities: centralitiesMap,
      metricsInfo: unifiedInfo,
      timesteps,

      disabledNodeMetricsKeys: new Set(),
      disabledEdgeMetricsKeys: new Set(),
    });

    if (timesteps.length > 0) {
      get().setTimestep(timesteps[0]);
    }
  },

  applyDeltaAndSetTimestep: (timestep) => {
    const {
      baseState,
      deltas,
      centralities,
      metricsInfo,
      disabledNodeMetricsKeys,
      disabledEdgeMetricsKeys,
    } = get();
    if (!baseState) {
      console.warn("No base state available");
      return;
    }

    const currentNodes = new Map(
      baseState.nodes.map((node) => [node.id, { ...node }]),
    );
    const currentEdges = new Map(
      baseState.edges.map((edge) => [edge.id, { ...edge }]),
    );

    const sortedTimesteps = Array.from(deltas.keys())
      .sort((a, b) => a - b)
      .filter((t) => t <= timestep);

    for (const t of sortedTimesteps) {
      const delta = deltas.get(t)!;
      applyDelta(currentNodes, currentEdges, delta);
    }

    const allCentralityKeys = Array.from(metricsInfo.values())
      .filter((info) => info.isCentrality)
      .map((info) => info.key);

    currentNodes.forEach((node) => {
      if (node.attributes) {
        allCentralityKeys.forEach((key) => {
          delete node.attributes![key];
        });
      }
    });

    currentEdges.forEach((edge) => {
      if (edge.attributes) {
        allCentralityKeys.forEach((key) => {
          delete edge.attributes![key];
        });
      }
    });

    const currentCentralities = centralities.get(timestep);
    if (currentCentralities) {
      Object.entries(currentCentralities.nodes).forEach(([nodeId, cents]) => {
        const node = currentNodes.get(nodeId);
        if (node) {
          if (!node.attributes) {
            node.attributes = {};
          }
          Object.entries(cents).forEach(([key, value]) => {
            node.attributes![key] = value;
          });
        }
      });

      Object.entries(currentCentralities.edges).forEach(([edgeId, cents]) => {
        const edge = currentEdges.get(edgeId);
        if (edge) {
          if (!edge.attributes) {
            edge.attributes = {};
          }
          Object.entries(cents).forEach(([key, value]) => {
            edge.attributes![key] = value;
          });
        }
      });
    }

    const currentNodeMetrics = new Map<string, Attributes>();
    const currentEdgeMetrics = new Map<string, Attributes>();

    currentNodes.forEach((node) => {
      if (node.attributes) {
        currentNodeMetrics.set(node.id, { ...node.attributes });
      }
    });

    currentEdges.forEach((edge) => {
      if (edge.attributes) {
        currentEdgeMetrics.set(edge.id, { ...edge.attributes });
      }
    });

    const currentNodeInfo = computeCurrentMetricsInfo(currentNodeMetrics);
    const currentEdgeInfo = computeCurrentMetricsInfo(currentEdgeMetrics);

    const metricsInfoCurrent = new Map<string, AttributeInfo>();

    currentNodeInfo.forEach((current, key) => {
      const global = metricsInfo.get(key);
      if (global) {
        metricsInfoCurrent.set(key, {
          ...global,
          values: current.values,
          range: current.range,
        });
      }
    });

    currentEdgeInfo.forEach((current, key) => {
      const global = metricsInfo.get(key);
      if (global) {
        metricsInfoCurrent.set(key, {
          ...global,
          values: current.values,
          range: current.range,
        });
      }
    });

    const nodeMetricsKeys = Array.from(
      new Set(
        Array.from(currentNodes.values()).flatMap((node) =>
          node.attributes ? Object.keys(node.attributes) : [],
        ),
      ),
    );

    const edgeMetricsKeys = Array.from(
      new Set(
        Array.from(currentEdges.values()).flatMap((edge) =>
          edge.attributes ? Object.keys(edge.attributes) : [],
        ),
      ),
    );

    const enabledMetricsKeys = nodeMetricsKeys.filter(
      (key) => !disabledNodeMetricsKeys.has(key),
    );

    const enabledEdgeMetricsKeys = edgeMetricsKeys.filter(
      (key) => !disabledEdgeMetricsKeys.has(key),
    );

    const brushRanges: Record<string, BrushRange | null> = {};
    [...nodeMetricsKeys, ...edgeMetricsKeys].forEach((key) => {
      if (!(key in brushRanges)) {
        brushRanges[key] = null;
      }
    });

    set({
      currentTimestep: timestep,
      currentNodes,
      currentEdges,
      nodeMetricsKeys,
      enabledMetricsKeys,
      edgeMetricsKeys,
      enabledEdgeMetricsKeys,
      brushRanges,
      metricsInfoCurrent,
    });
  },

  setEnabledMetricsKeys: (keys) => {
    set({ enabledMetricsKeys: keys });
  },

  toggleMetricsKey: (key) => {
    let removed = false;
    set((s) => {
      const isEdgeKey = s.edgeMetricsKeys.includes(key);
      const isNodeKey = s.nodeMetricsKeys.includes(key);

      if (isEdgeKey) {
        const isEnabled = s.enabledEdgeMetricsKeys.includes(key);
        if (isEnabled) {
          removed = true;
          const newDisabled = new Set(s.disabledEdgeMetricsKeys);
          newDisabled.add(key);
          return {
            enabledEdgeMetricsKeys: s.enabledEdgeMetricsKeys.filter(
              (k) => k !== key,
            ),
            disabledEdgeMetricsKeys: newDisabled,
          };
        } else {
          const newDisabled = new Set(s.disabledEdgeMetricsKeys);
          newDisabled.delete(key);
          return {
            enabledEdgeMetricsKeys: s.edgeMetricsKeys.filter(
              (k) => k === key || s.enabledEdgeMetricsKeys.includes(k),
            ),
            disabledEdgeMetricsKeys: newDisabled,
          };
        }
      } else if (isNodeKey) {
        const isEnabled = s.enabledMetricsKeys.includes(key);
        if (isEnabled) {
          removed = true;
          const newDisabled = new Set(s.disabledNodeMetricsKeys);
          newDisabled.add(key);
          return {
            enabledMetricsKeys: s.enabledMetricsKeys.filter((k) => k !== key),
            disabledNodeMetricsKeys: newDisabled,
          };
        } else {
          const newDisabled = new Set(s.disabledNodeMetricsKeys);
          newDisabled.delete(key);
          return {
            enabledMetricsKeys: s.nodeMetricsKeys.filter(
              (k) => k === key || s.enabledMetricsKeys.includes(k),
            ),
            disabledNodeMetricsKeys: newDisabled,
          };
        }
      }

      return {};
    });
    return removed;
  },

  setEnabledEdgeMetricsKeys: (keys) => {
    set({ enabledEdgeMetricsKeys: keys });
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

  setDisabledValues: (key, values) => {
    set((s) => ({
      disabledValues: {
        ...s.disabledValues,
        [key]: values,
      },
    }));
  },

  clearDisabledValues: (key) => {
    set((s) => ({
      disabledValues: { ...s.disabledValues, [key]: new Set() },
    }));
  },

  getColorForMetric: (key: string, value?: AttributeValue | null) => {
    const { metricsInfo } = get();
    const info = metricsInfo.get(key);

    if (!info) {
      return "var(--muted-foreground)";
    }

    const vizStore = useVisualizationStore.getState();

    if (info.isCentrality) {
      return vizStore.getOrAssignCentralityColor(key);
    }

    if (info.isCategory && value !== undefined && value !== null) {
      return vizStore.getOrAssignCategoryColor(key, value);
    }

    if (info.isCategory) {
      return "var(--muted-foreground)";
    }

    return vizStore.getOrAssignAttributeColor(key);
  },

  clearData: () =>
    set({
      nodeMetricsKeys: [],
      enabledMetricsKeys: [],
      metricsInfo: new Map(),
      metricsInfoCurrent: new Map(),
      edgeMetricsKeys: [],
      enabledEdgeMetricsKeys: [],
      disabledNodeMetricsKeys: new Set(),
      disabledEdgeMetricsKeys: new Set(),
      brushRanges: {},
      binnedDataByKey: new Map(),
      selectedCategories: {},
      disabledValues: {},
      timesteps: [],
      currentTimestep: null,
      currentNodes: new Map(),
      currentEdges: new Map(),
      baseState: null,
      deltas: new Map(),
      centralities: new Map(),
    }),
}));
