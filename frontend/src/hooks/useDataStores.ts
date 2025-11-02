import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import {
  defaultRadialSettings,
  useSettingsStore,
} from "@/stores/useSettingsStore";
import { useTimelineStore } from "@/stores/useTimelineStore";
import { useVisualizationStore } from "@/stores/useVisualizationStore";
import type { AttributeInfo, Centrality, Network } from "@/types/network";
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
    setTimesteps(timesteps);

    if (timesteps.length > 0 && timelineCentralities) {
      precomputeAllTimesteps(
        timesteps,
        timelines,
        attributes,
        timelineCentralities,
      );

      const allMetricInfosMap = new Map<string, AttributeInfo>();
      const timestepInfos = useMetricsStore.getState().timestepMetricsInfo;

      timestepInfos.forEach((infoMap) => {
        infoMap.forEach((info, key) => {
          if (!allMetricInfosMap.has(key)) {
            allMetricInfosMap.set(key, {
              ...info,
              values: new Set(info.values),
            });
          } else {
            const existing = allMetricInfosMap.get(key)!;
            info.values.forEach((v) => existing.values.add(v));
            if (info.range && existing.range) {
              existing.range.min = Math.min(existing.range.min, info.range.min);
              existing.range.max = Math.max(existing.range.max, info.range.max);
            }
          }
        });
      });

      useVisualizationStore
        .getState()
        .initializeColorScales(Array.from(allMetricInfosMap.values()));
    } else if (centralityData) {
      setMetricData(nodes, centralityData);

      const metricInfos = Array.from(
        useMetricsStore.getState().metricsInfo.values(),
      );

      useVisualizationStore.getState().initializeColorScales(metricInfos);
    }

    const calculatedRadial = calculateRadialSettings(nodes.length);
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
