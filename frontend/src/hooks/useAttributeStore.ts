import type {
  AttributeInfo,
  NodeAttributes,
  NodeAttributeValue,
} from "@/types/network";
import { flattenAttributes } from "@/utils/networkProcessing";
import { create } from "zustand";

interface AttributeStore {
  attributeData: Map<string, NodeAttributes>;
  attributeKeys: string[];
  enabledAttributeKeys: string[];
  attributeInfo: Map<string, AttributeInfo>;
  brushRanges: Record<string, [number, number] | null>;
  filteredAttributeData: Map<string, NodeAttributes>;

  setNodeAttributes: (nodes: any[]) => void;
  setEnabledAttributeKeys: (keys: string[]) => void;
  toggleAttributeKey: (key: string) => void;
  setBrushRange: (key: string, range: [number, number] | null) => void;
  clearBrushRange: (key: string) => void;
  clearAllBrushRanges: () => void;
  clearData: () => void;

  _updateFilteredAttributeData: () => void;
}

const filterAndMapAttributeData = (
  attributeData: Map<string, NodeAttributes>,
  enabledAttributeKeys: string[],
  brushRanges: Record<string, [number, number] | null>,
): Map<string, NodeAttributes> => {
  const filtered = new Map<string, NodeAttributes>();

  attributeData.forEach((attrs, id) => {
    const matches = enabledAttributeKeys.every((key) => {
      const value = attrs[key];
      const range = brushRanges[key];
      if (!range) return true;
      if (typeof value !== "number") return true;
      const [min, max] = range;
      return value >= min && value <= max;
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

export const useAttributeStore = create<AttributeStore>((set, get) => ({
  attributeData: new Map(),
  attributeKeys: [],
  enabledAttributeKeys: [],
  attributeInfo: new Map(),
  brushRanges: {},
  filteredAttributeData: new Map<string, NodeAttributes>(),

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
        info.isNominal = uniqueCount <= 20;
        info.isOrdinal = false;
      } else if (info.type === "number") {
        const allIntegers = Array.from(info.values).every((v) =>
          Number.isInteger(Number(v)),
        );
        info.isNominal = allIntegers && uniqueCount <= 20;
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

  setEnabledAttributeKeys: (keys) => set({ enabledAttributeKeys: keys }),

  toggleAttributeKey: (key) =>
    set((s) => {
      const isEnabled = s.enabledAttributeKeys.includes(key);
      if (isEnabled) {
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
    }),

  _updateFilteredAttributeData: () => {
    const state = get();
    const filtered = filterAndMapAttributeData(
      state.attributeData,
      state.enabledAttributeKeys,
      state.brushRanges,
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
      attributeData: new Map(),
      attributeKeys: [],
      enabledAttributeKeys: [],
      attributeInfo: new Map(),
      brushRanges: {},
    }),
}));
