import { useMetricsStore } from "@/stores/useMetricsStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useMemo } from "react";

export const useKeys = () => {
  const nodeKeys = useMetricsStore((s) => s.metricsKeys);
  const enabledMetricsKeys = useMetricsStore((s) => s.enabledMetricsKeys);
  const metricsInfo = useMetricsStore((s) => s.metricsInfo);
  const displayMode = useSettingsStore((s) => s.displaySettings.displayMode);
  const enabledEdgeKeys = useMetricsStore((s) => s.enabledEdgeMetricsKeys);
  const edgeKeys = useMetricsStore((s) => s.edgeMetricsKeys);
  const { attributeKeys, centralityKeys } = useMemo(() => {
    const attrs: string[] = [];
    const cents: string[] = [];

    nodeKeys.forEach((key) => {
      const info = metricsInfo.get(key);
      if (info?.isCentrality) {
        cents.push(key);
      } else {
        attrs.push(key);
      }
    });

    return { attributeKeys: attrs, centralityKeys: cents };
  }, [nodeKeys, metricsInfo]);

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

  const enabledNodeKeys = useMemo(() => {
    if (displayMode === "attributes") return [...enabledAttributeKeys];
    if (displayMode === "centrality") return [...enabledCentralityKeys];
    return [...enabledCentralityKeys, ...enabledAttributeKeys];
  }, [enabledAttributeKeys, enabledCentralityKeys, displayMode]);

  return {
    enabledNodeKeys,
    attributeKeys,
    centralityKeys,
    enabledAttributeKeys,
    enabledCentralityKeys,
    nodeKeys,
    enabledEdgeKeys,
    edgeKeys,
  };
};
