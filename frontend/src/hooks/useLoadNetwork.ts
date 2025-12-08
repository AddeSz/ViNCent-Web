import { getProjectEnvVariables } from "@/shared/projectEnvVariables";
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

const env = getProjectEnvVariables();
const API_BASE_URL = env.envVariables.VITE_BACKEND_URL;

export interface NetworkResponse {
  network: Network;
  base_state: Network;
  deltas: Record<number, TimestepDelta>;
  centralities: Record<number, CentralityData>;
  metrics_info: {
    nodes: Record<string, AttributeInfo>;
    edges: Record<string, AttributeInfo>;
  };
}

const validateAndPreprocessNetwork = async (formData: FormData) => {
  const response = await fetch(`${API_BASE_URL}/validate-network`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return await response.json();
};

export const useLoadNetwork = () => {
  const setNetwork = useNetworkStore((s) => s.setNetwork);
  const clearNetworkData = useNetworkStore((s) => s.clearData);
  const clearVisualizationData = useVisualizationStore((s) => s.clearData);
  const clearMetricsData = useMetricsStore((s) => s.clearData);

  const loadNetwork = async (formData: FormData, datasetID?: string) => {
    const result = await validateAndPreprocessNetwork(formData);
    const { network, base_state, deltas, centralities, metrics_info } = result;

    console.log("Result: ", result);
    console.log("Network", network);
    console.log("base_state", base_state);
    console.log("deltas", deltas);
    console.log("centralities", centralities);

    setNetwork(network);

    const loadDeltaBasedNetwork =
      useMetricsStore.getState().loadDeltaBasedNetwork;
    const allMetricsInfo = {
      ...metrics_info.nodes,
      ...metrics_info.edges,
    };
    loadDeltaBasedNetwork(base_state!, deltas!, centralities!, allMetricsInfo);

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
