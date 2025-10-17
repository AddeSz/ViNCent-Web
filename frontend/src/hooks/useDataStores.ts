import type { Centrality, Network } from "@/types/network";

import { useAttributeStore } from "@/stores/useAttributeStore";
import { useCentralityStore } from "@/stores/useCentralityStore";
import {
  defaultRadialSettings,
  useChartSettings,
} from "@/stores/useChartSettingsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import {
  calculateRadialSettings,
  networkPreprocessing,
} from "@/utils/networkProcessing";

import {
  calculateCentralityValues,
  calculateCentralityValuesTimeline,
} from "@/utils/backendAPI";

export const useDataStores = () => {
  const setNetwork = useNetworkStore((s) => s.setNetwork);
  const setNodeAttributes = useAttributeStore((s) => s.setNodeAttributes);
  const precomputeAllAttributeTimesteps = useAttributeStore(
    (s) => s.precomputeAllAttributeTimesteps,
  );

  const setTimesteps = useTimelineStore((s) => s.setTimesteps);

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
  const clearTimelineData = useTimelineStore((s) => s.clearData);

  const loadNetwork = async (data: Network) => {
    const { network, nodes, timesteps, timelines, attributes } =
      networkPreprocessing(data);

    let centralityData: Centrality[] | null = null;
    let timelineCentralities: Map<number, Centrality[]> | null = null;

    if (timesteps.length > 0) {
      timelineCentralities = await calculateCentralityValuesTimeline(
        data,
        timesteps,
        timelines,
      );
    } else {
      centralityData = await calculateCentralityValues(data);
    }

    setNetwork(network);
    setNodeAttributes(nodes);
    setTimesteps(timesteps);

    if (timesteps.length > 0) {
      precomputeAllAttributeTimesteps(timesteps, timelines, attributes);
    }

    const calculatedRadial = calculateRadialSettings(nodes.length);
    useChartSettings.getState().setInitialRadialSettings({
      ...defaultRadialSettings,
      ...calculatedRadial,
    });

    const attributeInfos = Array.from(
      useAttributeStore.getState().attributeInfo.values(),
    );
    initializeAttributeColorScale(attributeInfos);

    useChartSettings.getState().setDisplaySettings({
      displayMode:
        !attributeInfos || attributeInfos.length === 0 ? "centrality" : "both",
    });

    if (timesteps.length > 0 && timelineCentralities) {
      useCentralityStore
        .getState()
        .precomputeAllCentralityTimesteps(timesteps, timelineCentralities);
    } else if (centralityData) {
      useCentralityStore.getState().setCentralityData(centralityData);
    }

    initializeCentralityColorScale(
      useCentralityStore.getState().centralityKeys,
    );
  };

  const clearAllData = () => {
    clearNetworkData();
    clearCentralityData();
    clearVisualizationData();
    clearAttributeData();
    clearTimelineData();
  };

  return {
    loadNetwork,
    clearAllData,
  };
};
