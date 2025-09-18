import { useAttributeStore } from "@/hooks/useAttributeStore";
import type { CombinedData } from "@/types/network";
import useFilteredCentralityData from "@/features/center-view-feature/hooks/useFilteredCentralityData";
import { useMemo } from "react";
import { useNetworkStore } from "@/hooks/useNetworkStore";
import { useChartSettings } from "@/hooks/useChartSettings";

const useCombinedData = (): {
  combinedDataMap: Map<string, CombinedData>;
  combinedData: CombinedData[];
} => {
  const nodeMap = useNetworkStore((state) => state.nodeMap);
  const nodeAttributes = useAttributeStore((state) => state.nodeAttributes);
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

export default useCombinedData;
