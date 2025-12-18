import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import type {
  AttributeInfo,
  CentralityData,
  Network,
  TimestepDelta,
} from "@/types/network";
import api from "@/utils/api";

export interface NetworkResponse {
  network: Network;
  base_state: Network;
  deltas: Record<number, TimestepDelta>;
  centralities: Record<number, CentralityData>;
  metrics_info: {
    nodes: Record<string, AttributeInfo>;
    edges: Record<string, AttributeInfo>;
  };
  communities: Record<number, Record<string, Record<string, number>>>;
  graph_type: "directed" | "undirected";
}

export const useLoadNetwork = () => {
  const setNetwork = useNetworkStore((s) => s.setNetwork);
  const clearNetworkData = useNetworkStore((s) => s.clearData);
  const clearVisualizationData = useVisualizationStore((s) => s.clearData);
  const clearMetricsData = useMetricsStore((s) => s.clearData);

  const loadNetwork = async (formData: FormData) => {
    const result: NetworkResponse = await api.validateNetwork(formData);
    const {
      network,
      base_state,
      deltas,
      centralities,
      metrics_info,
      graph_type,
      communities,
    } = result;
    console.log(result);

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
