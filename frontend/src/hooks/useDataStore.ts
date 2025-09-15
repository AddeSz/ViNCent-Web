import type { Network, Centrality } from "@/types/network";

import { useNetworkStore } from "./useNetworkStore";
import { useCentralityStore } from "./useCentralityStore";
import { useVisualizationStore } from "./useVisualizationStore";
import { useAttributeStore } from "./useAttributeStore";

export const useDataStore = () => {
  const setNetwork = useNetworkStore((state) => state.setNetwork);
  const setNodeAttributes = useAttributeStore(
    (state) => state.setNodeAttributes,
  );
  const setCentralityData = useCentralityStore(
    (state) => state.setCentralityData,
  );
  const initializeColorScale = useVisualizationStore(
    (state) => state.initializeColorScale,
  );
  const clearNetworkData = useNetworkStore((state) => state.clearData);
  const clearCentralityData = useCentralityStore((state) => state.clearData);
  const clearVisualizationData = useVisualizationStore(
    (state) => state.clearData,
  );
  const clearAttributeData = useAttributeStore((state) => state.clearData);

  const loadNetwork = (data: Network) => {
    setNetwork(data);
    setNodeAttributes(data.nodes);
  };

  const loadCentralityData = (data: Centrality[]) => {
    setCentralityData(data);

    const keysSet = new Set<string>();
    data.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== "id") keysSet.add(key);
      });
    });
    initializeColorScale(Array.from(keysSet));
  };

  const clearAllData = () => {
    clearNetworkData();
    clearCentralityData();
    clearVisualizationData();
    clearAttributeData();
  };

  return {
    loadNetwork,
    loadCentralityData,
    clearAllData,
  };
};
