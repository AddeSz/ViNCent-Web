import type { Centrality, Network } from "@/types/network";

import { useAttributeStore } from "./useAttributeStore";
import { useCentralityStore } from "./useCentralityStore";
import { useNetworkStore } from "./useNetworkStore";
import { useVisualizationStore } from "./useVisualizationStore";

export const useDataStore = () => {
  const setNetwork = useNetworkStore((s) => s.setNetwork);
  const setNodeAttributes = useAttributeStore((s) => s.setNodeAttributes);
  const setCentralityData = useCentralityStore((s) => s.setCentralityData);
  const initializeCentralityColorScale = useVisualizationStore(
    (s) => s.initializeCentralityColorScale,
  );
  const initializeAttributeColorScale = useVisualizationStore(
    (s) => s.initializeAttributeColorScale,
  );
  const clearNetworkData = useNetworkStore((s) => s.clearData);
  const clearCentralityData = useCentralityStore((s) => s.clearData);
  const clearVisualizationData = useVisualizationStore((s) => s.clearData);
  const clearAttributeData = useAttributeStore((s) => s.clearData);

  const loadNetwork = (data: Network) => {
    setNetwork(data);
    setNodeAttributes(data.nodes);

    const attributeInfos = Object.values(
      useAttributeStore.getState().attributeInfo,
    );
    initializeAttributeColorScale(attributeInfos);
  };

  const loadCentralityData = (data: Centrality[]) => {
    setCentralityData(data);
    initializeCentralityColorScale(
      useCentralityStore.getState().centralityKeys,
    );
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
