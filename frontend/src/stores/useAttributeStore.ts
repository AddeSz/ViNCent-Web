import type {
  AttributeInfo,
  Node,
  NodeAttributes,
  NodeAttributeValue,
  TimelineEntry,
} from "@/types/network";
import { flattenAttributes } from "@/utils/networkProcessing";
import { create } from "zustand";

interface AttributeStore {
  timestepAttributeData: Map<number, Map<string, NodeAttributes>>;
  timestepAttributeInfo: Map<number, Map<string, AttributeInfo>>;

  attributeData: Map<string, NodeAttributes>;
  attributeKeys: string[];
  enabledAttributeKeys: string[];
  attributeInfo: Map<string, AttributeInfo>;
  brushRanges: Record<string, [number, number] | null>;
  selectedCategories: Record<string, string[]>;
  filteredAttributeData: Map<string, NodeAttributes>;

  currentTimestep: number | null;

  setNodeAttributes: (nodes: Node[]) => void;
  precomputeAllAttributeTimesteps: (
    timesteps: number[],
    timelines: Map<string, TimelineEntry[]>,
    attributes: Map<string, NodeAttributes>,
  ) => void;
  setCurrentTimestep: (timestep: number) => void;
  setEnabledAttributeKeys: (keys: string[]) => void;
  toggleAttributeKey: (key: string) => boolean;
  setBrushRange: (key: string, range: [number, number] | null) => void;
  setSelectedCategories: (key: string, categories: string[]) => void;
  clearBrushRange: (key: string) => void;
  clearAllBrushRanges: () => void;
  clearData: () => void;

  _updateFilteredAttributeData: () => void;
}

const filterAndMapAttributeData = (
  attributeData: Map<string, NodeAttributes>,
  enabledAttributeKeys: string[],
  brushRanges: Record<string, [number, number] | null>,
  selectedCategories: Record<string, string[]>,
) => {
  const filtered = new Map<string, NodeAttributes>();

  attributeData.forEach((attrs, id) => {
    const matches = enabledAttributeKeys.every((key) => {
      const value = attrs[key];

      const range = brushRanges[key];
      if (range && typeof value === "number") {
        const [min, max] = range;
        if (value < min || value > max) return false;
      }

      const selected = selectedCategories[key];
      if (selected && selected.length > 0) {
        if (!selected.includes(String(value))) return false;
      }

      return true;
    });

    if (matches) {
      const result: NodeAttributes = {};
      for (const key of enabledAttributeKeys) {
        if (key in attrs) {
          result[key] = attrs[key];
        }
      }
      filtered.set(id, result);
    }
  });

  return filtered;
};

const computeAttributeDataForTimestep = (
  timelines: Map<string, TimelineEntry[]>,
  timestep: number,
  staticAttributes: Map<string, NodeAttributes>,
): { data: Map<string, NodeAttributes>; info: Map<string, AttributeInfo> } => {
  const attributeData = new Map<string, NodeAttributes>();

  staticAttributes.forEach((attrs, nodeId) => {
    attributeData.set(nodeId, { ...attrs });
  });

  timelines.forEach((history, nodeId) => {
    const entry = history.find((h) => h.timestep === timestep);
    if (entry && entry.attributes) {
      const flattened = flattenAttributes(entry.attributes);
      const existing = attributeData.get(nodeId) || {};
      attributeData.set(nodeId, { ...existing, ...flattened });
    }
  });

  const attributeKeys = new Set<string>();
  const attributeInfo = new Map<string, AttributeInfo>();

  attributeData.forEach((attrs) => {
    Object.entries(attrs).forEach(([key, value]) => {
      attributeKeys.add(key);

      if (!attributeInfo.has(key)) {
        attributeInfo.set(key, {
          key,
          type: "string",
          values: new Set<NodeAttributeValue>(),
          isNominal: false,
          isOrdinal: false,
          isNumeric: false,
          isBoolean: false,
        });
      }

      const info = attributeInfo.get(key)!;
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

  attributeInfo.forEach((info) => {
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

  return { data: attributeData, info: attributeInfo };
};

export const useAttributeStore = create<AttributeStore>((set, get) => ({
  timestepAttributeData: new Map(),
  timestepAttributeInfo: new Map(),
  attributeData: new Map(),
  attributeKeys: [],
  enabledAttributeKeys: [],
  attributeInfo: new Map(),
  brushRanges: {},
  selectedCategories: {},
  filteredAttributeData: new Map<string, NodeAttributes>(),
  currentTimestep: null,

  setNodeAttributes: (nodes) => {
    const attributeData = new Map<string, NodeAttributes>();
    nodes.forEach((node) => {
      if (node.attributes) {
        const flattenedAttrs = flattenAttributes(node.attributes);
        attributeData.set(node.id, flattenedAttrs);
      }
    });

    const attributeKeys = new Set<string>();
    const attributeInfo = new Map<string, AttributeInfo>();

    attributeData.forEach((attrs) => {
      Object.entries(attrs).forEach(([key, value]) => {
        attributeKeys.add(key);

        if (!attributeInfo.has(key)) {
          attributeInfo.set(key, {
            key,
            type: "string",
            values: new Set<NodeAttributeValue>(),
            isNominal: false,
            isOrdinal: false,
            isNumeric: false,
            isBoolean: false,
          });
        }

        const info = attributeInfo.get(key)!;
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

    attributeInfo.forEach((info) => {
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

    const attributeKeysArray = Array.from(attributeKeys);
    set({
      attributeData,
      attributeKeys: attributeKeysArray,
      attributeInfo,
      enabledAttributeKeys: attributeKeysArray,
    });

    get()._updateFilteredAttributeData();
  },

  precomputeAllAttributeTimesteps: (timesteps, timelines, attributes) => {
    const timestepAttributeData = new Map<
      number,
      Map<string, NodeAttributes>
    >();
    const timestepAttributeInfo = new Map<number, Map<string, AttributeInfo>>();

    timesteps.forEach((timestep) => {
      const { data, info } = computeAttributeDataForTimestep(
        timelines,
        timestep,
        attributes,
      );
      timestepAttributeData.set(timestep, data);
      timestepAttributeInfo.set(timestep, info);
    });

    set({
      timestepAttributeData,
      timestepAttributeInfo,
    });

    if (timesteps.length > 0) {
      get().setCurrentTimestep(timesteps[0]);
    }
  },

  setCurrentTimestep: (timestep) => {
    const { timestepAttributeData, timestepAttributeInfo } = get();

    const attributeData = timestepAttributeData.get(timestep);
    const attributeInfo = timestepAttributeInfo.get(timestep);

    if (!attributeData || !attributeInfo) {
      console.warn(`No precomputed data for timestep ${timestep}`);
      return;
    }

    const attributeKeysArray = Array.from(attributeInfo.keys());

    set({
      currentTimestep: timestep,
      attributeData,
      attributeInfo,
      attributeKeys: attributeKeysArray,
      enabledAttributeKeys: attributeKeysArray,
    });

    get()._updateFilteredAttributeData();
  },

  setEnabledAttributeKeys: (keys) => set({ enabledAttributeKeys: keys }),

  toggleAttributeKey: (key) => {
    let removed = false;
    set((s) => {
      const isEnabled = s.enabledAttributeKeys.includes(key);
      if (isEnabled) {
        removed = true;
        return {
          enabledAttributeKeys: s.enabledAttributeKeys.filter((k) => k !== key),
        };
      } else {
        return {
          enabledAttributeKeys: s.attributeKeys.filter(
            (k) => k === key || s.enabledAttributeKeys.includes(k),
          ),
        };
      }
    });
    get()._updateFilteredAttributeData();
    return removed;
  },

  setSelectedCategories: (key, categories) => {
    set((state) => ({
      selectedCategories: {
        ...state.selectedCategories,
        [key]: categories,
      },
    }));
    get()._updateFilteredAttributeData();
  },

  _updateFilteredAttributeData: () => {
    const state = get();
    const filtered = filterAndMapAttributeData(
      state.attributeData,
      state.enabledAttributeKeys,
      state.brushRanges,
      state.selectedCategories,
    );
    set({ filteredAttributeData: filtered });
  },

  setBrushRange: (key, range) => {
    set((s) => ({
      brushRanges: { ...s.brushRanges, [key]: range },
    }));
    get()._updateFilteredAttributeData();
  },

  clearBrushRange: (key) => {
    set((s) => {
      const { [key]: removed, ...rest } = s.brushRanges;
      return { brushRanges: rest };
    });
    get()._updateFilteredAttributeData();
  },

  clearAllBrushRanges: () => {
    set({ brushRanges: {} });
    get()._updateFilteredAttributeData();
  },

  clearData: () =>
    set({
      timestepAttributeData: new Map(),
      timestepAttributeInfo: new Map(),
      attributeData: new Map(),
      attributeKeys: [],
      enabledAttributeKeys: [],
      attributeInfo: new Map(),
      brushRanges: {},
      selectedCategories: {},
      filteredAttributeData: new Map(),
      currentTimestep: null,
    }),
}));
