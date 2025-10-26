import { useChartSettings } from "@/stores/useChartSettingsStore";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useMemo } from "react";

export const useKeys = () => {
  const metricsKeys = useMetricsStore((s) => s.metricsKeys);
  const enabledMetricsKeys = useMetricsStore((s) => s.enabledMetricsKeys);
  const metricsInfo = useMetricsStore((s) => s.metricsInfo);
  const displayMode = useChartSettings((s) => s.displaySettings.displayMode);

  const { attributeKeys, centralityKeys } = useMemo(() => {
    const attrs: string[] = [];
    const cents: string[] = [];

    metricsKeys.forEach((key) => {
      const info = metricsInfo.get(key);
      if (info?.isCentrality) {
        cents.push(key);
      } else {
        attrs.push(key);
      }
    });

    return { attributeKeys: attrs, centralityKeys: cents };
  }, [metricsKeys, metricsInfo]);

  const { enabledAttributeKeys, enabledCentralityKeys } = useMemo(() => {
    const attrs: string[] = [];
    const cents: string[] = [];

    enabledMetricsKeys.forEach((key) => {
      const info = metricsInfo.get(key);
      if (info?.isCentrality) {
        cents.push(key);
      } else {
        attrs.push(key);
      }
    });

    return { enabledAttributeKeys: attrs, enabledCentralityKeys: cents };
  }, [enabledMetricsKeys, metricsInfo]);

  const allKeys = useMemo(() => {
    if (displayMode === "attributes") return [...enabledAttributeKeys];
    if (displayMode === "centrality") return [...enabledCentralityKeys];
    return [...enabledCentralityKeys, ...enabledAttributeKeys];
  }, [enabledAttributeKeys, enabledCentralityKeys, displayMode]);

  return {
    allKeys,
    attributeKeys,
    centralityKeys,
    enabledAttributeKeys,
    enabledCentralityKeys,
  };
};
