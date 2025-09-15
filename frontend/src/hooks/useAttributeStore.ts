import { create } from "zustand";
import type {
  NodeAttributes,
  AttributeInfo,
  NodeAttributeValue,
} from "@/types/network";
import { flattenAttributes } from "@/utils/networkProcessing";

interface AttributeStore {
  nodeAttributes: Record<string, NodeAttributes>;
  attributeKeys: string[];
  enabledAttributeKeys: string[];
  attributeInfo: Record<string, AttributeInfo>;
  setNodeAttributes: (nodes: any[]) => void;
  setEnabledAttributeKeys: (keys: string[]) => void;
  toggleAttributeKey: (key: string) => void;
  getAttributeValuesForKey: (key: string) => NodeAttributeValue[];
  clearData: () => void;
}

export const useAttributeStore = create<AttributeStore>((set, get) => ({
  nodeAttributes: {},
  attributeKeys: [],
  enabledAttributeKeys: [],
  attributeInfo: {},

  setNodeAttributes: (nodes) => {
    const nodeAttributes: Record<string, NodeAttributes> = {};
    nodes.forEach((node) => {
      if (node.attributes) {
        const flattenedAttrs = flattenAttributes(node.attributes);
        nodeAttributes[node.id] = flattenedAttrs;
      }
    });

    const attributeKeys = new Set<string>();
    const attributeInfo: Record<string, AttributeInfo> = {};

    Object.values(nodeAttributes).forEach((attrs) => {
      Object.keys(attrs).forEach((key) => {
        attributeKeys.add(key);

        if (!attributeInfo[key]) {
          attributeInfo[key] = {
            key,
            type: "string",
            values: new Set(),
            isCategorical: false,
          };
        }

        const value = attrs[key];
        attributeInfo[key].values.add(value);

        if (typeof value === "number") {
          if (attributeInfo[key].type !== "number") {
            const allNumbers = Array.from(attributeInfo[key].values).every(
              (v) => typeof v === "number" || !isNaN(Number(v)),
            );
            if (allNumbers) {
              attributeInfo[key].type = "number";
            }
          }
        } else if (typeof value === "boolean") {
          if (attributeInfo[key].type === "string") {
            const allBooleans = Array.from(attributeInfo[key].values).every(
              (v) => typeof v === "boolean" || v === "true" || v === "false",
            );
            if (allBooleans) {
              attributeInfo[key].type = "boolean";
            }
          }
        }
      });
    });

    // Determine categorical attributes
    Object.values(attributeInfo).forEach((info) => {
      const uniqueCount = info.values.size;

      if (info.type === "string") {
        info.isCategorical = uniqueCount <= 20;
      } else if (info.type === "number") {
        const allIntegers = Array.from(info.values).every((v) =>
          Number.isInteger(Number(v)),
        );
        info.isCategorical = allIntegers && uniqueCount <= 20;
      } else if (info.type === "boolean") {
        info.isCategorical = true;
      }
    });

    set({
      nodeAttributes,
      attributeKeys: Array.from(attributeKeys),
      attributeInfo,
      enabledAttributeKeys: [],
    });
  },

  setEnabledAttributeKeys: (keys) => set({ enabledAttributeKeys: keys }),

  toggleAttributeKey: (key) =>
    set((state) => ({
      enabledAttributeKeys: state.enabledAttributeKeys.includes(key)
        ? state.enabledAttributeKeys.filter((k) => k !== key)
        : [...state.enabledAttributeKeys, key],
    })),

  getAttributeValuesForKey: (key) => {
    const info = get().attributeInfo[key];
    return info ? Array.from(info.values) : [];
  },

  clearData: () =>
    set({
      nodeAttributes: {},
      attributeKeys: [],
      enabledAttributeKeys: [],
      attributeInfo: {},
    }),
}));
