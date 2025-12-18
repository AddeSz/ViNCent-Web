import { useMetricsStore } from "@/stores/useMetricsStore";
import { useMemo } from "react";

export const useKeys = () => {
  const allNodeKeys = useMetricsStore((s) => s.nodeMetricsKeys);
  const enabledNodeMetricsKeys = useMetricsStore(
    (s) => s.enabledNodeMetricsKeys,
  );
  const metricsInfo = useMetricsStore((s) => s.metricsInfo);
  const enabledEdgeMetricsKeys = useMetricsStore(
    (s) => s.enabledEdgeMetricsKeys,
  );
  const allEdgeKeys = useMetricsStore((s) => s.edgeMetricsKeys);

  const { allNodeAttributeKeys, allNodeCentralityKeys, allNodeCommunityKeys } =
    useMemo(() => {
      const attrs: string[] = [];
      const cents: string[] = [];
      const comms: string[] = [];

      allNodeKeys.forEach((key) => {
        const info = metricsInfo.get(key);
        if (info?.isCommunity) {
          comms.push(key);
        } else if (info?.isCentrality) {
          cents.push(key);
        } else {
          attrs.push(key);
        }
      });

      return {
        allNodeAttributeKeys: attrs,
        allNodeCentralityKeys: cents,
        allNodeCommunityKeys: comms,
      };
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

  const {
    enabledNodeAttributeKeys,
    enabledNodeCentralityKeys,
    enabledNodeCommunityKeys,
  } = useMemo(() => {
    const attrs: string[] = [];
    const cents: string[] = [];
    const comms: string[] = [];

    enabledNodeMetricsKeys.forEach((key) => {
      const info = metricsInfo.get(key);
      if (info?.isCommunity) {
        comms.push(key);
      } else if (info?.isCentrality) {
        cents.push(key);
      } else {
        attrs.push(key);
      }
    });

    return {
      enabledNodeAttributeKeys: attrs,
      enabledNodeCentralityKeys: cents,
      enabledNodeCommunityKeys: comms,
    };
  }, [enabledNodeMetricsKeys, metricsInfo]);

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
    return [...enabledNodeCentralityKeys, ...enabledNodeAttributeKeys];
  }, [enabledNodeAttributeKeys, enabledNodeCentralityKeys]);

  const enabledEdgeKeys = useMemo(() => {
    return [...enabledEdgeCentralityKeys, ...enabledEdgeAttributeKeys];
  }, [enabledEdgeAttributeKeys, enabledEdgeCentralityKeys]);

  const sortedAllNodeKeys = useMemo(() => {
    return [
      ...allNodeCentralityKeys,
      ...allNodeAttributeKeys,
      ...allNodeCommunityKeys,
    ];
  }, [allNodeCentralityKeys, allNodeAttributeKeys, allNodeCommunityKeys]);

  const sortedAllEdgeKeys = useMemo(() => {
    return [...allEdgeCentralityKeys, ...allEdgeAttributeKeys];
  }, [allEdgeCentralityKeys, allEdgeAttributeKeys]);

  return {
    allNodeAttributeKeys,
    allNodeCentralityKeys,
    allNodeCommunityKeys,
    allNodeKeys: sortedAllNodeKeys,
    allEdgeAttributeKeys,
    allEdgeCentralityKeys,
    allEdgeKeys: sortedAllEdgeKeys,
    enabledNodeAttributeKeys,
    enabledNodeCentralityKeys,
    enabledNodeCommunityKeys,
    enabledNodeKeys,
    enabledEdgeAttributeKeys,
    enabledEdgeCentralityKeys,
    enabledEdgeKeys,
  };
};
