import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import {
  defaultRadialSettings,
  useSettingsStore,
} from "@/stores/useSettingsStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import type { AttributeRecord, Network } from "@/types/network";
import {
  calculateCentralityValues,
  calculateCentralityValuesTimeline,
} from "@/utils/backendAPI";
import {
  calculateRadialSettings,
  networkPreprocessing,
} from "@/utils/networkProcessing";

export const useDataStores = () => {
  const setNetwork = useNetworkStore((s) => s.setNetwork);
  const setTimesteps = useTimelineStore((s) => s.setTimesteps);
  const clearNetworkData = useNetworkStore((s) => s.clearData);
  const clearVisualizationData = useVisualizationStore((s) => s.clearData);
  const clearTimelineData = useTimelineStore((s) => s.clearData);
  const setMetricData = useMetricsStore((s) => s.setMetricData);
  const precomputeAllTimesteps = useMetricsStore(
    (s) => s.precomputeAllTimesteps,
  );
  const clearMetricsData = useMetricsStore((s) => s.clearData);

  const loadNetwork = async (data: Network, datasetID?: string) => {
    const { network, nodes, timesteps, timelines, attributes } =
      networkPreprocessing(data);

    let nodeCentralityData: AttributeRecord[] | null = null;
    let edgeCentralityData: AttributeRecord[] | null = null;
    let nodeCentralityKeys: Set<string> = new Set();
    let edgeCentralityKeys: Set<string> = new Set();
    let timelineNodeCentralities: Map<number, AttributeRecord[]> | null = null;
    let timelineEdgeCentralities: Map<number, AttributeRecord[]> | null = null;

    if (timesteps.length > 0) {
      const timelineResults = await calculateCentralityValuesTimeline(
        data,
        timesteps,
        timelines,
        datasetID,
      );
      timelineNodeCentralities = timelineResults.nodes;
      timelineEdgeCentralities = timelineResults.edges;
      nodeCentralityKeys = timelineResults.nodeCentralityKeys;
      edgeCentralityKeys = timelineResults.edgeCentralityKeys;
    } else {
      const results = await calculateCentralityValues(data, datasetID);
      nodeCentralityData = results.nodes;
      edgeCentralityData = results.edges;
      nodeCentralityKeys = new Set(results.nodeCentralityKeys);
      edgeCentralityKeys = new Set(results.edgeCentralityKeys);
    }

    setNetwork(network);
    setTimesteps(timesteps);

    if (
      timesteps.length > 0 &&
      timelineNodeCentralities &&
      timelineEdgeCentralities
    ) {
      precomputeAllTimesteps(
        timesteps,
        timelines,
        attributes,
        timelineNodeCentralities,
        timelineEdgeCentralities,
        nodeCentralityKeys,
        edgeCentralityKeys,
      );
    } else if (nodeCentralityData && edgeCentralityData) {
      setMetricData(
        nodes,
        nodeCentralityData,
        edgeCentralityData,
        nodeCentralityKeys,
        edgeCentralityKeys,
      );
    }

    const calculatedRadial = calculateRadialSettings(
      nodes.length,
      useMetricsStore.getState().metricsInfo.size,
    );
    useSettingsStore.getState().setInitialRadialSettings({
      ...defaultRadialSettings,
      ...calculatedRadial,
    });

    const attributeCount = Array.from(
      useMetricsStore.getState().metricsInfo.values(),
    ).filter((info) => !info.isCentrality).length;

    useSettingsStore.getState().setDisplaySettings({
      displayMode: attributeCount === 0 ? "centrality" : "both",
    });
  };

  const clearAllData = () => {
    clearNetworkData();
    clearVisualizationData();
    clearTimelineData();
    clearMetricsData();
  };

  return {
    loadNetwork,
    clearAllData,
  };
};
