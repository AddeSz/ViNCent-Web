import type { Attributes, Network, Node, TimelineEntry } from "@/types/network";

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

export const calculateRadialSettings = (numNodes: number) => {
  let innerRadius: number;
  let outerRadius: number;

  if (numNodes <= 50) {
    innerRadius = 150;
    outerRadius = 600;
  } else if (numNodes <= 150) {
    const t = (numNodes - 50) / (150 - 50);
    innerRadius = 150 + t * (250 - 150);
    outerRadius = 600 + t * (850 - 600);
  } else if (numNodes <= 1000) {
    const t = (numNodes - 150) / (1000 - 150);
    innerRadius = 250 + t * (400 - 250);
    outerRadius = 850 + t * (1000 - 850);
  } else if (numNodes <= 2000) {
    const t = (numNodes - 1000) / (2000 - 1000);
    innerRadius = 400 + t * (1000 - 400);
    outerRadius = 1000 + t * (1600 - 1000);
  } else {
    const maxNodes = 5000;
    const t = Math.min((numNodes - 2000) / (maxNodes - 2000), 1);
    const eased = Math.sqrt(t);
    innerRadius = 800 + eased * (3400 - 800);
    outerRadius = 1600 + eased * (4000 - 1600);
  }

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
