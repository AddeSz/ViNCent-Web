import { useAttributeStore } from "@/hooks/useAttributeStore";
import type { CombinedData } from "@/types/network";
import useFilteredCentralityData from "./useFilteredCentralityData";
import { useMemo } from "react";
import { useNetworkStore } from "@/hooks/useNetworkStore";

const useCombinedData = (): Map<string, CombinedData> => {
  const networkData = useNetworkStore((state) => state.network);
  const nodeAttributes = useAttributeStore((state) => state.nodeAttributes);
  const centralityData = useFilteredCentralityData();

  return useMemo(() => {
    const map = new Map<string, CombinedData>();
    centralityData.forEach((c) => {
      const baseNode = networkData.nodes.find((n) => n.id === c.id) || {};
      map.set(c.id, {
        ...baseNode,
        ...c,
        ...(nodeAttributes[c.id] || {}),
      });
    });
    return map;
  }, [networkData.nodes, centralityData, nodeAttributes]);
};

export default useCombinedData;
