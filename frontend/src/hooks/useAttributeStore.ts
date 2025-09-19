import type {
  AttributeInfo,
  NodeAttributes,
  NodeAttributeValue,
} from "@/types/network";
import { flattenAttributes } from "@/utils/networkProcessing";
import { create } from "zustand";

interface AttributeStore {
  nodeAttributes: Map<string, NodeAttributes>;
  attributeKeys: string[];
  enabledAttributeKeys: string[];
  attributeInfo: Map<string, AttributeInfo>;
  setNodeAttributes: (nodes: any[]) => void;
  setEnabledAttributeKeys: (keys: string[]) => void;
  toggleAttributeKey: (key: string) => void;
  getAttributeValuesForKey: (key: string) => NodeAttributeValue[];
  clearData: () => void;
}

export const useAttributeStore = create<AttributeStore>((set, get) => ({
  nodeAttributes: new Map(),
  attributeKeys: [],
  enabledAttributeKeys: [],
  attributeInfo: new Map(),

  setNodeAttributes: (nodes) => {
    const nodeAttributes = new Map<string, NodeAttributes>();
    nodes.forEach((node) => {
      if (node.attributes) {
        const flattenedAttrs = flattenAttributes(node.attributes);
        nodeAttributes.set(node.id, flattenedAttrs);
      }
    });

    const attributeKeys = new Set<string>();
    const attributeInfo = new Map<string, AttributeInfo>();

    nodeAttributes.forEach((attrs) => {
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
      nodeAttributes,
      attributeKeys: attributeKeysArray,
      attributeInfo,
      enabledAttributeKeys: attributeKeysArray,
    });
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

  getAttributeValuesForKey: (key) => {
    const info = get().attributeInfo.get(key);
    return info ? Array.from(info.values) : [];
  },

  clearData: () =>
    set({
      nodeAttributes: new Map(),
      attributeKeys: [],
      enabledAttributeKeys: [],
      attributeInfo: new Map(),
    }),
}));
