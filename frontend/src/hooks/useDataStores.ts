import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import { validateAndPreprocessNetwork } from "@/utils/backendAPI";

export const useDataStores = () => {
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
