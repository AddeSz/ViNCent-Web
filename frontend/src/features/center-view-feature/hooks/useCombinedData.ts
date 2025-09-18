import { useFilteredCentralityData } from "@/features/center-view-feature/hooks/useFilteredCentralityData";
import { useAttributeStore } from "@/hooks/useAttributeStore";
import { useChartSettings } from "@/hooks/useChartSettings";
import { useNetworkStore } from "@/hooks/useNetworkStore";
import type { CombinedData } from "@/types/network";
import { useMemo } from "react";

export const useCombinedData = (): {
  combinedDataMap: Map<string, CombinedData>;
  combinedData: CombinedData[];
} => {
  const nodeMap = useNetworkStore((s) => s.nodeMap);
  const nodeAttributes = useAttributeStore((s) => s.nodeAttributes);
  const centralityData = useFilteredCentralityData();
  const { displayMode } = useChartSettings();

  return useMemo(() => {
    const map = new Map<string, CombinedData>();

    centralityData.forEach((c) => {
      const baseNode = nodeMap.get(c.id);
      if (!baseNode) return;

      const { vx, vy, x, y, attributes, index, ...filteredBaseNode } = baseNode;
      let combined: CombinedData = { ...filteredBaseNode };

      if (displayMode === "centrality") {
        combined = { ...combined, ...c };
      } else if (displayMode === "attributes") {
        combined = { ...combined, ...(nodeAttributes[c.id] || {}) };
      } else {
        combined = { ...combined, ...c, ...(nodeAttributes[c.id] || {}) };
      }

      map.set(c.id, combined);
    });

    const combinedData = Array.from(map.values());
    return {
      combinedDataMap: map,
      combinedData,
    };
  }, [nodeMap, centralityData, nodeAttributes, displayMode]);
};
