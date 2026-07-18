import { useFilterStore } from "@/stores/useFilterStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type { AttributeInfo } from "@/types";
import { useMemo } from "react";

function categorizeNodeKeys(
  keys: string[],
  metricsInfo: Map<string, AttributeInfo>,
) {
  const attributeKeys: string[] = [];
  const centralityKeys: string[] = [];
  const communityKeys: string[] = [];

  keys.forEach((key) => {
    const info = metricsInfo.get(key);
    if (info?.isCommunity) {
      communityKeys.push(key);
    } else if (info?.isCentrality) {
      centralityKeys.push(key);
    } else {
      attributeKeys.push(key);
    }
  });

  return { attributeKeys, centralityKeys, communityKeys };
}

function categorizeEdgeKeys(
  keys: string[],
  metricsInfo: Map<string, AttributeInfo>,
) {
  const attributeKeys: string[] = [];
  const centralityKeys: string[] = [];

  keys.forEach((key) => {
    const info = metricsInfo.get(key);
    if (info?.isCentrality) {
      centralityKeys.push(key);
    } else {
      attributeKeys.push(key);
    }
  });

  return { attributeKeys, centralityKeys };
}

export const useKeys = () => {
  const currentNodes = useNetworkStore((s) => s.currentNodes);
  const currentEdges = useNetworkStore((s) => s.currentEdges);
  const currentCommunities = useNetworkStore((s) => s.currentCommunities);
  const metricsInfo = useNetworkStore((s) => s.metricsInfo);
  const disabledNodeMetricsKeys = useFilterStore(
    (s) => s.disabledNodeMetricsKeys,
  );
  const disabledEdgeMetricsKeys = useFilterStore(
    (s) => s.disabledEdgeMetricsKeys,
  );

  const rawNodeKeys = useMemo(() => {
    const keys = new Set<string>();
    currentNodes.forEach((node) => {
      if (node.attributes) {
        Object.keys(node.attributes).forEach((k) => keys.add(k));
      }
    });
    if (currentCommunities) {
      Object.keys(currentCommunities).forEach((k) => keys.add(k));
    }
    return Array.from(keys);
  }, [currentNodes, currentCommunities]);

  const rawEdgeKeys = useMemo(() => {
    const keys = new Set<string>();
    currentEdges.forEach((edge) => {
      if (edge.attributes) {
        Object.keys(edge.attributes).forEach((k) => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [currentEdges]);

  const enabledNodeMetricsKeys = useMemo(
    () => rawNodeKeys.filter((k) => !disabledNodeMetricsKeys.has(k)),
    [rawNodeKeys, disabledNodeMetricsKeys],
  );

  const enabledEdgeMetricsKeys = useMemo(
    () => rawEdgeKeys.filter((k) => !disabledEdgeMetricsKeys.has(k)),
    [rawEdgeKeys, disabledEdgeMetricsKeys],
  );

  const {
    attributeKeys: allNodeAttributeKeys,
    centralityKeys: allNodeCentralityKeys,
    communityKeys: allNodeCommunityKeys,
  } = useMemo(
    () => categorizeNodeKeys(rawNodeKeys, metricsInfo),
    [rawNodeKeys, metricsInfo],
  );

  const {
    attributeKeys: allEdgeAttributeKeys,
    centralityKeys: allEdgeCentralityKeys,
  } = useMemo(
    () => categorizeEdgeKeys(rawEdgeKeys, metricsInfo),
    [rawEdgeKeys, metricsInfo],
  );

  const {
    attributeKeys: enabledNodeAttributeKeys,
    centralityKeys: enabledNodeCentralityKeys,
    communityKeys: enabledNodeCommunityKeys,
  } = useMemo(
    () => categorizeNodeKeys(enabledNodeMetricsKeys, metricsInfo),
    [enabledNodeMetricsKeys, metricsInfo],
  );

  const {
    attributeKeys: enabledEdgeAttributeKeys,
    centralityKeys: enabledEdgeCentralityKeys,
  } = useMemo(
    () => categorizeEdgeKeys(enabledEdgeMetricsKeys, metricsInfo),
    [enabledEdgeMetricsKeys, metricsInfo],
  );

  const allNodeKeys = useMemo(
    () => [
      ...allNodeCentralityKeys,
      ...allNodeAttributeKeys,
      ...allNodeCommunityKeys,
    ],
    [allNodeCentralityKeys, allNodeAttributeKeys, allNodeCommunityKeys],
  );

  const allEdgeKeys = useMemo(
    () => [...allEdgeCentralityKeys, ...allEdgeAttributeKeys],
    [allEdgeCentralityKeys, allEdgeAttributeKeys],
  );

  const enabledNodeKeys = useMemo(
    () => [
      ...enabledNodeCentralityKeys,
      ...enabledNodeAttributeKeys,
      ...enabledNodeCommunityKeys,
    ],
    [
      enabledNodeCentralityKeys,
      enabledNodeAttributeKeys,
      enabledNodeCommunityKeys,
    ],
  );

  const enabledEdgeKeys = useMemo(
    () => [...enabledEdgeCentralityKeys, ...enabledEdgeAttributeKeys],
    [enabledEdgeCentralityKeys, enabledEdgeAttributeKeys],
  );

  return {
    allNodeAttributeKeys,
    enabledNodeAttributeKeys,
    allNodeCentralityKeys,
    enabledNodeCentralityKeys,
    allNodeCommunityKeys,
    enabledNodeCommunityKeys,
    allNodeKeys,
    enabledNodeKeys,

    allEdgeAttributeKeys,
    enabledEdgeAttributeKeys,
    allEdgeCentralityKeys,
    enabledEdgeCentralityKeys,
    allEdgeKeys,
    enabledEdgeKeys,
  };
};
