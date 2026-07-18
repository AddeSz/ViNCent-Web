import { useFilterStore } from "@/stores/useFilterStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type {
  AttributeInfo,
  Attributes,
  AttributeValue,
  Edge,
  Node,
} from "@/types";
import { getNodeId } from "@/utils/utils";
import { useMemo } from "react";

const computeMetricsValues = (
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
        currentInfo.set(key, { values: new Set(), range: undefined });
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

export const useCurrentMetricsInfo = (): Map<string, AttributeInfo> => {
  const currentNodes = useNetworkStore((s) => s.currentNodes);
  const currentEdges = useNetworkStore((s) => s.currentEdges);
  const metricsInfo = useNetworkStore((s) => s.metricsInfo);
  const currentCommunities = useNetworkStore((s) => s.currentCommunities);
  const hiddenNodes = useFilterStore((s) => s.hiddenNodes);

  return useMemo(() => {
    const visibleNodeMetrics = new Map<string, Attributes>();
    const visibleEdgeMetrics = new Map<string, Attributes>();

    currentNodes.forEach((node: Node, nodeId) => {
      if (!hiddenNodes.has(nodeId) && node.attributes) {
        visibleNodeMetrics.set(nodeId, { ...node.attributes });
      }
    });

    currentEdges.forEach((edge: Edge, edgeId) => {
      if (
        !hiddenNodes.has(getNodeId(edge.source)) &&
        !hiddenNodes.has(getNodeId(edge.target)) &&
        edge.attributes
      ) {
        visibleEdgeMetrics.set(edgeId, { ...edge.attributes });
      }
    });

    const currentNodeInfo = computeMetricsValues(visibleNodeMetrics);
    const currentEdgeInfo = computeMetricsValues(visibleEdgeMetrics);
    const result = new Map<string, AttributeInfo>();

    currentNodeInfo.forEach((current, key) => {
      const global = metricsInfo.get(key);
      if (global) {
        result.set(key, {
          ...global,
          values: current.values,
          range: current.range,
        });
      }
    });

    currentEdgeInfo.forEach((current, key) => {
      const global = metricsInfo.get(key);
      if (global) {
        result.set(key, {
          ...global,
          values: current.values,
          range: current.range,
        });
      }
    });

    if (currentCommunities) {
      Object.keys(currentCommunities).forEach((communityKey) => {
        const global = metricsInfo.get(communityKey);
        if (global && global.isCommunity) {
          const communityValues = new Set<AttributeValue>();
          Object.entries(currentCommunities[communityKey]).forEach(
            ([nodeId, value]) => {
              if (!hiddenNodes.has(nodeId)) communityValues.add(value);
            },
          );
          result.set(communityKey, { ...global, values: communityValues });
        }
      });
    }

    return result;
  }, [
    currentNodes,
    currentEdges,
    metricsInfo,
    currentCommunities,
    hiddenNodes,
  ]);
};
