import { useColorStore } from "@/stores/useColorStore";
import { useFilterStore } from "@/stores/useFilterStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type { ProcessNetworkResponse } from "@/types";

export const useLoadNetwork = () => {
  const clearNetworkData = useNetworkStore((s) => s.clearData);
  const clearColorData = useColorStore((s) => s.clearData);
  const clearFilterData = useFilterStore((s) => s.clearData);

  const loadNetwork = async (data: ProcessNetworkResponse) => {
    const {
      network,
      base_state: baseState,
      deltas,
      centralities,
      metrics_info: metricsInfo,
      graph_type: graphType,
      timesteps,
      communities,
    } = data;
    console.log(data);

    const allMetricsInfo = {
      ...metricsInfo.nodes,
      ...metricsInfo.edges,
    };

    useNetworkStore.getState().loadDataset({
      network,
      graphType,
      baseState,
      deltas,
      centralities,
      allMetricsInfo,
      communities,
      timesteps,
    });
    useColorStore
      .getState()
      .initializeColors(useNetworkStore.getState().metricsInfo);

    useFilterStore.getState().initializeBrushRanges(allMetricsInfo);
  };

  const clearAllData = () => {
    clearNetworkData();
    clearColorData();
    clearFilterData();
  };

  return {
    loadNetwork,
    clearAllData,
  };
};
