import type { Network } from "@/types/network";

export const calculateLinkCounts = (network: Network): Network => {
  const linkCountMap = new Map<string, number>();
  network.links.forEach((link) => {
    const sourceId =
      typeof link.source === "string" ? link.source : link.source.id;
    const targetId =
      typeof link.target === "string" ? link.target : link.target.id;

    linkCountMap.set(sourceId, (linkCountMap.get(sourceId) ?? 0) + 1);
    linkCountMap.set(targetId, (linkCountMap.get(targetId) ?? 0) + 1);
  });

  const nodeData = network.nodes.map((node) => ({
    ...node,
    linkCount: linkCountMap.get(node.id) ?? 0,
  }));

  return { ...network, nodes: nodeData };
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
