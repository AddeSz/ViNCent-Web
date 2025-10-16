import type {
  Network,
  Node,
  NodeAttributes,
  TimelineEntry,
} from "@/types/network";

type PreprocessedNetwork = {
  network: Network;
  nodes: Omit<Node, "history">[];
  timesteps: number[];
  timelines: Map<string, TimelineEntry[]>;
  attributes: Map<string, NodeAttributes>;
};

export const networkPreprocessing = (network: Network): PreprocessedNetwork => {
  const networkClone: Network = JSON.parse(JSON.stringify(network));

  const timestepSet = new Set<number>();
  const timelines = new Map<string, TimelineEntry[]>();
  const attributeMap = new Map<string, NodeAttributes>();

  const nodeData = networkClone.nodes.map((node) => {
    const { attributes, history, ...rest } = node;

    const processedAttributes: NodeAttributes = attributes || {};
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
  let innerRadius = 150;
  let outerRadius = 600;

  if (numNodes > 50) {
    innerRadius = Math.round((150 + (numNodes - 50)) / 10) * 10;
    outerRadius = Math.round((600 + (numNodes - 50)) / 10) * 12;
  }

  return { innerRadius, outerRadius };
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
