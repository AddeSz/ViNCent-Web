import { useAttributeStore } from "@/stores/useAttributeStore";
import { useCentralityStore } from "@/stores/useCentralityStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type { CombinedData } from "@/types/network";
import { useMemo } from "react";

export const useCombinedData = (): {
  combinedDataMap: Map<string, CombinedData>;
  combinedData: CombinedData[];
} => {
  const nodeData = useNetworkStore((s) => s.nodeMap);
  const attributeData = useAttributeStore((s) => s.filteredAttributeData);
  const centralityData = useCentralityStore((s) => s.filteredCentralityData);
  return useMemo(() => {
    const map = new Map<string, CombinedData>();

    nodeData.forEach((baseNode, id) => {
      const attrs = attributeData.get(id);
      const centrality = centralityData.get(id);

      const { vx, vy, x, y, attributes, index, ...filteredBaseNode } = baseNode;

      let combined: CombinedData = { ...filteredBaseNode };

      if (!centrality || !attrs) return;
      if (centrality) combined = { ...combined, ...centrality };
      if (attrs) combined = { ...combined, ...attrs };
      map.set(id, combined);
    });

    const combinedData = Array.from(map.values());

    return { combinedDataMap: map, combinedData };
  }, [nodeData, centralityData, attributeData]);
};
