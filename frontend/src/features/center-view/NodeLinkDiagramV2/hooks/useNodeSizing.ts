import type { NodeLinkSettings } from "@/stores/useSettingsStore";
import type { AttributeInfo, GraphNode, ViewNode } from "@/types";
import { useEffect } from "react";

function createLinearScale(
  domain: [number, number],
  range: [number, number],
): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  if (d0 === d1) return () => (r0 + r1) / 2;

  return (value: number) => {
    const t = (value - d0) / (d1 - d0);
    return r0 + Math.min(1, Math.max(0, t)) * (r1 - r0);
  };
}

// derives GraphNode.size from the active sizing mode/metric and mutates
// nodes in place so react-force-graph can keep using the same instances
export function useNodeSizing({
  nodesById,
  nodeData,
  nodeLinkSettings,
  currentMetricsInfo,
}: {
  nodesById: Map<string, GraphNode>;
  nodeData: Map<string, ViewNode>;
  nodeLinkSettings: NodeLinkSettings;
  currentMetricsInfo: Map<string, AttributeInfo>;
}) {
  const {
    nodeSizeMode,
    nodeSizeMetric,
    fixedNodeSize,
    minNodeSize,
    maxNodeSize,
  } = nodeLinkSettings;

  // Extracted so the effect below only reruns when THIS metrics range actually changes
  const range = nodeSizeMetric
    ? (currentMetricsInfo.get(nodeSizeMetric)?.range ?? null)
    : null;
  const rangeMin = range?.min;
  const rangeMax = range?.max;

  useEffect(() => {
    if (nodeSizeMode === "fixed" || !nodeSizeMetric || !range) {
      for (const node of nodesById.values()) node.size = fixedNodeSize;
      return;
    }

    const scale = createLinearScale(
      [range.min, range.max],
      [minNodeSize, maxNodeSize],
    );

    for (const [id, node] of nodesById) {
      const raw = nodeData.get(id)?.attributes[nodeSizeMetric];
      const value = typeof raw === "number" ? raw : Number(raw);
      node.size = Number.isFinite(value) ? scale(value) : minNodeSize;
    }
  }, [
    nodesById,
    nodeData,
    nodeSizeMode,
    nodeSizeMetric,
    fixedNodeSize,
    minNodeSize,
    maxNodeSize,
    rangeMin,
    rangeMax,
  ]);
}
