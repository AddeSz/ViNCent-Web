import { useAttributeStore } from "@/hooks/useAttributeStore";
import { useCentralityStore } from "@/hooks/useCentralityStore";
import { useChartSettings } from "@/hooks/useChartSettings";
import { useNetworkStore } from "@/hooks/useNetworkStore";
import type { CombinedData } from "@/types/network";
import { useMemo } from "react";

export const useCombinedData = (): {
  combinedDataMap: Map<string, CombinedData>;
  combinedData: CombinedData[];
} => {
  const nodeData = useNetworkStore((s) => s.nodeMap);
  const attributeData = useAttributeStore((s) => s.filteredAttributeData);
  const centralityData = useCentralityStore((s) => s.filteredCentralityData);
  const { displayMode } = useChartSettings();

  return useMemo(() => {
    const map = new Map<string, CombinedData>();

    centralityData.forEach((c) => {
      const id = c.id;
      const baseNode = nodeData.get(id);
      const attrs = attributeData.get(id);

      if (!baseNode || (!attrs && attributeData.size > 0)) return;

      const { vx, vy, x, y, attributes, index, ...filteredBaseNode } = baseNode;
      let combined: CombinedData = { ...filteredBaseNode };

      if (displayMode === "centrality") {
        combined = { ...combined, ...c };
      } else if (displayMode === "attributes") {
        combined = { ...combined, ...(attrs || {}) };
      } else {
        combined = { ...combined, ...c, ...(attrs || {}) };
      }

      map.set(id, combined);
    });

    const combinedData = Array.from(map.values());

    return {
      combinedDataMap: map,
      combinedData,
    };
  }, [nodeData, centralityData, attributeData, displayMode]);
};
