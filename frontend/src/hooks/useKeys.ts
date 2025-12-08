import { useMetricsStore } from "@/stores/useMetricsStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useMemo } from "react";

export const useKeys = () => {
  const allNodeKeys = useMetricsStore((s) => s.nodeMetricsKeys);
  const enabledMetricsKeys = useMetricsStore((s) => s.enabledMetricsKeys);
  const metricsInfo = useMetricsStore((s) => s.metricsInfo);
  const displayMode = useSettingsStore((s) => s.displaySettings.displayMode);
  const enabledEdgeMetricsKeys = useMetricsStore(
    (s) => s.enabledEdgeMetricsKeys,
  );
  const allEdgeKeys = useMetricsStore((s) => s.edgeMetricsKeys);

  const { allNodeAttributeKeys, allNodeCentralityKeys } = useMemo(() => {
    const attrs: string[] = [];
    const cents: string[] = [];
    allNodeKeys.forEach((key) => {
      const info = metricsInfo.get(key);
      if (info?.isCentrality) {
        cents.push(key);
      } else {
        attrs.push(key);
      }
    });
    return { allNodeAttributeKeys: attrs, allNodeCentralityKeys: cents };
  }, [allNodeKeys, metricsInfo]);

  const { allEdgeAttributeKeys, allEdgeCentralityKeys } = useMemo(() => {
    const attrs: string[] = [];
    const cents: string[] = [];
    allEdgeKeys.forEach((key) => {
      const info = metricsInfo.get(key);
      if (info?.isCentrality) {
        cents.push(key);
      } else {
        attrs.push(key);
      }
    });
    return { allEdgeAttributeKeys: attrs, allEdgeCentralityKeys: cents };
  }, [allEdgeKeys, metricsInfo]);

  const { enabledNodeAttributeKeys, enabledNodeCentralityKeys } =
    useMemo(() => {
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
      return {
        enabledNodeAttributeKeys: attrs,
        enabledNodeCentralityKeys: cents,
      };
    }, [enabledMetricsKeys, metricsInfo]);

  const { enabledEdgeAttributeKeys, enabledEdgeCentralityKeys } =
    useMemo(() => {
      const attrs: string[] = [];
      const cents: string[] = [];
      enabledEdgeMetricsKeys.forEach((key) => {
        const info = metricsInfo.get(key);
        if (info?.isCentrality) {
          cents.push(key);
        } else {
          attrs.push(key);
        }
      });
      return {
        enabledEdgeAttributeKeys: attrs,
        enabledEdgeCentralityKeys: cents,
      };
    }, [enabledEdgeMetricsKeys, metricsInfo]);

  const enabledNodeKeys = useMemo(() => {
    if (displayMode === "attributes") return [...enabledNodeAttributeKeys];
    if (displayMode === "centrality") return [...enabledNodeCentralityKeys];
    return [...enabledNodeCentralityKeys, ...enabledNodeAttributeKeys];
  }, [enabledNodeAttributeKeys, enabledNodeCentralityKeys, displayMode]);

  const enabledEdgeKeys = useMemo(() => {
    if (displayMode === "attributes") return [...enabledEdgeAttributeKeys];
    if (displayMode === "centrality") return [...enabledEdgeCentralityKeys];
    return [...enabledEdgeCentralityKeys, ...enabledEdgeAttributeKeys];
  }, [enabledEdgeAttributeKeys, enabledEdgeCentralityKeys, displayMode]);

  const sortedAllNodeKeys = useMemo(() => {
    return [...allNodeCentralityKeys, ...allNodeAttributeKeys];
  }, [allNodeCentralityKeys, allNodeAttributeKeys]);

  const sortedAllEdgeKeys = useMemo(() => {
    return [...allEdgeCentralityKeys, ...allEdgeAttributeKeys];
  }, [allEdgeCentralityKeys, allEdgeAttributeKeys]);

  return {
    allNodeAttributeKeys,
    allNodeCentralityKeys,
    allNodeKeys: sortedAllNodeKeys,
    allEdgeAttributeKeys,
    allEdgeCentralityKeys,
    allEdgeKeys: sortedAllEdgeKeys,
    enabledNodeAttributeKeys,
    enabledNodeCentralityKeys,
    enabledNodeKeys,
    enabledEdgeAttributeKeys,
    enabledEdgeCentralityKeys,
    enabledEdgeKeys,
  };
};
