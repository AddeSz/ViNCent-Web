import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import type { ProcessNetworkResponse } from "@/types";

export const useLoadNetwork = () => {
  const setNetwork = useNetworkStore((s) => s.setNetwork);
  const clearNetworkData = useNetworkStore((s) => s.clearData);
  const clearVisualizationData = useVisualizationStore((s) => s.clearData);
  const clearMetricsData = useMetricsStore((s) => s.clearData);

  const loadNetwork = async (data: ProcessNetworkResponse) => {
    const {
      network,
      base_state,
      deltas,
      centralities,
      metrics_info,
      graph_type,
      timesteps,
      communities,
    } = data;
    console.log(data);

    setNetwork(network, graph_type);

    const loadDeltaBasedNetwork =
      useMetricsStore.getState().loadDeltaBasedNetwork;
    const allMetricsInfo = {
      ...metrics_info.nodes,
      ...metrics_info.edges,
    };
    loadDeltaBasedNetwork(
      base_state!,
      deltas!,
      centralities!,
      allMetricsInfo,
      communities,
      timesteps,
    );

    const metricsInfo = useMetricsStore.getState().metricsInfo;
    useSettingsStore
      .getState()
      .setInitialNetworkSettings(network.nodes.length, metricsInfo.size);
  };

  const clearAllData = () => {
    clearNetworkData();
    clearVisualizationData();
    clearMetricsData();
  };

  return {
    loadNetwork,
    clearAllData,
  };
};
