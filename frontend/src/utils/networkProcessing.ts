import type { Attributes, Network, Node, TimelineEntry } from "@/types/network";
import { calculateBandwidth } from "./utils";

type PreprocessedNetwork = {
  network: Network;
  nodes: Omit<Node, "history">[];
  timesteps: number[];
  timelines: Map<string, TimelineEntry[]>;
  attributes: Map<string, Attributes>;
};

export const networkPreprocessing = (network: Network): PreprocessedNetwork => {
  const networkClone: Network = JSON.parse(JSON.stringify(network));

  const timestepSet = new Set<number>();
  const timelines = new Map<string, TimelineEntry[]>();
  const attributeMap = new Map<string, Attributes>();

  const nodeData = networkClone.nodes.map((node) => {
    const { attributes, history, ...rest } = node;

    const processedAttributes: Attributes = attributes || {};
    const processedHistory = Array.isArray(history) ? history : [];

    timelines.set(node.id, processedHistory);

    processedHistory.forEach((h) => {
      if (typeof h.timestep === "number") {
        timestepSet.add(h.timestep);
      }
    });

    if (Object.keys(processedAttributes).length > 0) {
      attributeMap.set(node.id, processedAttributes);
    }

    return {
      ...rest,
      attributes: processedAttributes,
    };
  });

  const cleanNetwork: Network = {
    ...networkClone,
    nodes: nodeData.map(({ attributes, ...rest }) => rest),
  };

  return {
    network: cleanNetwork,
    nodes: nodeData,
    timesteps: Array.from(timestepSet).sort((a, b) => a - b),
    timelines,
    attributes: attributeMap,
  };
};

export const calculateRadialSettings = (
  numNodes: number,
  numMetrics: number,
) => {
  const bandwidth = calculateBandwidth(numNodes);
  let targetWidth: number;
  if (numNodes <= 100) {
    targetWidth = 7;
  } else if (numNodes <= 500) {
    const t = (numNodes - 100) / (500 - 100);
    targetWidth = 7 - t * 2;
  } else if (numNodes <= 1000) {
    const t = (numNodes - 500) / (1000 - 500);
    targetWidth = 5 - t * 2.5;
  } else {
    targetWidth = 2.5;
  }

  let targetHeight: number;
  if (numMetrics > 30) {
    targetHeight = 20;
  } else if (numMetrics > 20) {
    targetHeight = 25;
  } else {
    targetHeight = 30;
  }

  const calculatedInnerRadius = bandwidth > 0 ? targetWidth / bandwidth : 150;
  const innerRadius = Math.max(150, calculatedInnerRadius);

  const calculatedOuterRadius =
    numMetrics > 0
      ? innerRadius + targetHeight * numMetrics
      : innerRadius + targetHeight;
  const clampedOuterRadius = Math.min(4000, calculatedOuterRadius);

  const outerRadius = Math.max(clampedOuterRadius, innerRadius + 200);

  const snapTo10 = (value: number) => Math.round(value / 10) * 10;
  return {
    innerRadius: snapTo10(innerRadius),
    outerRadius: snapTo10(outerRadius),
  };
};

export const flattenAttributes = (
  obj: any,
  prefix = "",
): Record<string, any> => {
  const flattened: Record<string, any> = {};

  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(flattened, flattenAttributes(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  });

  return flattened;
};
