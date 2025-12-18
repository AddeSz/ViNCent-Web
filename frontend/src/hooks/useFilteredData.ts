import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { DataChanges, FullData } from "@/types/network";
import { diffData } from "@/utils/diffData";
import { useMemo, useRef } from "react";

const emptyChanges: DataChanges = { added: {}, removed: {}, updated: {} };

export const useFilteredData = (): {
  nodeMap: Map<string, FullData>;
  edgeMap: Map<string, FullData>;
  nodeChanges: DataChanges;
  edgeChanges: DataChanges;
} => {
  const nodeData = useNetworkStore((s) => s.nodeMap);
  const currentNodes = useMetricsStore((s) => s.currentNodes);
  const currentEdges = useMetricsStore((s) => s.currentEdges);
  const enabledNodeMetricsKeys = useMetricsStore(
    (s) => s.enabledNodeMetricsKeys,
  );
  const brushRanges = useMetricsStore((s) => s.brushRanges);
  const selectedCategories = useMetricsStore((s) => s.selectedCategories);
  const binnedDataByKey = useMetricsStore((s) => s.binnedDataByKey);
  const disabledValues = useMetricsStore((s) => s.disabledValues);
  const metricsInfo = useMetricsStore((s) => s.metricsInfo);

  const enabledEdgeMetricsKeys = useMetricsStore(
    (s) => s.enabledEdgeMetricsKeys,
  );

  const previewChanges = useSettingsStore(
    (s) => s.displaySettings.previewChanges,
  );
  const showForeshadowing = useSettingsStore(
    (s) => s.displaySettings.showForeshadowing,
  );

  const prevNodeMapRef = useRef<Map<string, FullData> | null>(null);
  const prevChangesRef = useRef<DataChanges>(emptyChanges);

  const prevEdgeMapRef = useRef<Map<string, FullData> | null>(null);
  const prevEdgeChangesRef = useRef<DataChanges>(emptyChanges);

  return useMemo(() => {
    let i = 0;
    const currentMap = new Map<string, FullData>();
    currentNodes.forEach((node, id) => {
      i++;
      const metrics = node.attributes || {};

      const matchesFilters = enabledNodeMetricsKeys.every((key) => {
        const value = metrics[key];
        const info = metricsInfo.get(key);

        const rangeObj = brushRanges[key];
        if (rangeObj && typeof value === "number") {
          const {
            range: [min, max],
            inclusive,
          } = rangeObj;
          const upperBoundCheck = inclusive ? value > max : value >= max;
          if (value < min || upperBoundCheck) return false;
        }

        const disabledValuesForKey = disabledValues[key];
        if (disabledValuesForKey && disabledValuesForKey.size > 0) {
          if (info && info.isCategory) {
            if (disabledValuesForKey.has(String(value))) {
              return false;
            }
          } else if (info && info.isNumeric && typeof value === "number") {
            const binnedData = binnedDataByKey.get(key);
            if (binnedData) {
              const binIndex = binnedData.valueToBinIndex.get(value);
              if (
                binIndex !== undefined &&
                disabledValuesForKey.has(binIndex)
              ) {
                return false;
              }
            }
          } else {
            if (disabledValuesForKey.has(String(value))) {
              return false;
            }
          }
        }

        const selected = selectedCategories[key];
        if (selected && selected.length > 0) {
          if (!selected.includes(String(value))) return false;
        }

        return true;
      });

      if (!matchesFilters) return;

      const filteredMetrics: Record<string, any> = {};
      for (const key of enabledNodeMetricsKeys) {
        if (key in metrics) {
          filteredMetrics[key] = metrics[key];
        } else {
          filteredMetrics[key] = null;
        }
      }

      currentMap.set(id, {
        id: node.id,
        label: node.label,
        ...filteredMetrics,
        removed: false,
        stable: false,
        index: i - 1,
      });
    });

    i = 0;
    const currentEdgeMap = new Map<string, FullData>();
    currentEdges.forEach((edge, edgeId) => {
      i++;
      const metrics = edge.attributes || {};

      const matchesFilters = enabledEdgeMetricsKeys.every((key) => {
        const value = metrics[key];
        const info = metricsInfo.get(key);

        const rangeObj = brushRanges[key];
        if (rangeObj && typeof value === "number") {
          const {
            range: [min, max],
            inclusive,
          } = rangeObj;
          const upperBoundCheck = inclusive ? value > max : value >= max;
          if (value < min || upperBoundCheck) return false;
        }

        const disabledValuesForKey = disabledValues[key];
        if (disabledValuesForKey && disabledValuesForKey.size > 0) {
          if (info && info.isCategory) {
            if (disabledValuesForKey.has(String(value))) {
              return false;
            }
          } else if (info && info.isNumeric && typeof value === "number") {
            const binnedData = binnedDataByKey.get(key);
            if (binnedData) {
              const binIndex = binnedData.valueToBinIndex.get(value);
              if (
                binIndex !== undefined &&
                disabledValuesForKey.has(binIndex)
              ) {
                return false;
              }
            }
          } else {
            if (disabledValuesForKey.has(String(value))) {
              return false;
            }
          }
        }

        const selected = selectedCategories[key];
        if (selected && selected.length > 0) {
          if (!selected.includes(String(value))) return false;
        }

        return true;
      });

      if (!matchesFilters) return;

      const filteredMetrics: Record<string, any> = {};
      for (const key of enabledEdgeMetricsKeys) {
        if (key in metrics) {
          filteredMetrics[key] = metrics[key];
        } else {
          filteredMetrics[key] = null;
        }
      }

      currentEdgeMap.set(edgeId, {
        id: edgeId,
        ...filteredMetrics,
        removed: false,
        stable: false,
        index: i - 1,
      });
    });

    const prevMap = prevNodeMapRef.current || new Map();
    const nodeChanges = diffData(prevMap, currentMap);

    const hasChanges =
      Object.keys(nodeChanges.added || {}).length > 0 ||
      Object.keys(nodeChanges.removed || {}).length > 0 ||
      Object.keys(nodeChanges.updated || {}).length > 0;

    if (hasChanges) {
      prevNodeMapRef.current = new Map(currentMap);
      prevChangesRef.current = nodeChanges;
    }

    const activeNodeChanges = hasChanges
      ? nodeChanges
      : prevChangesRef.current || { added: {}, removed: {}, updated: {} };

    const prevEdgeMap = prevEdgeMapRef.current || new Map();

    const validEdgeMap = new Map<string, FullData>();
    currentEdgeMap.forEach((edge, edgeId) => {
      const [source, target] = edgeId.split("|");
      if (currentMap.has(source) && currentMap.has(target)) {
        validEdgeMap.set(edgeId, edge);
      }
    });

    const edgeChanges = diffData(prevEdgeMap, validEdgeMap);

    const hasEdgeChanges =
      Object.keys(edgeChanges.added || {}).length > 0 ||
      Object.keys(edgeChanges.removed || {}).length > 0 ||
      Object.keys(edgeChanges.updated || {}).length > 0;

    if (hasEdgeChanges) {
      prevEdgeMapRef.current = new Map(validEdgeMap);
      prevEdgeChangesRef.current = edgeChanges;
    }

    const activeEdgeChanges = hasEdgeChanges
      ? edgeChanges
      : prevEdgeChangesRef.current || { added: {}, removed: {}, updated: {} };

    const removedEdgeSet = new Set(
      Object.keys(activeEdgeChanges.removed ?? {}),
    );
    const filteredEdges = new Map<string, FullData>(validEdgeMap);

    if (previewChanges) {
      for (const edgeId of removedEdgeSet) {
        if (!filteredEdges.has(edgeId)) {
          filteredEdges.set(edgeId, {
            ...activeEdgeChanges.removed[edgeId],
            removed: true,
            stable: false,
          });
        }
      }
    }

    const removedSet = new Set(Object.keys(activeNodeChanges.removed ?? {}));
    const filteredNodes = new Map<string, FullData>();
    const baseNodeSource = showForeshadowing ? nodeData : currentNodes;

    for (const id of nodeData.keys()) {
      if (currentMap.has(id)) {
        filteredNodes.set(id, currentMap.get(id)!);
      } else if (baseNodeSource.has(id)) {
        const baseNode = baseNodeSource.get(id)!;

        if (previewChanges && removedSet.has(id)) {
          filteredNodes.set(id, {
            ...activeNodeChanges.removed[id],
            removed: true,
            stable: false,
          });
        } else {
          filteredNodes.set(id, {
            id,
            label: baseNode.label,
            removed: false,
            stable: true,
          });
        }
      } else if (previewChanges && removedSet.has(id)) {
        filteredNodes.set(id, {
          ...activeNodeChanges.removed[id],
          removed: true,
          stable: false,
        });
      }
    }

    return {
      nodeMap: filteredNodes,
      edgeMap: filteredEdges,
      nodeChanges: activeNodeChanges,
      edgeChanges: activeEdgeChanges,
    };
  }, [
    nodeData,
    currentNodes,
    currentEdges,
    enabledNodeMetricsKeys,
    brushRanges,
    disabledValues,
    binnedDataByKey,
    selectedCategories,
    previewChanges,
    showForeshadowing,
    enabledEdgeMetricsKeys,
    metricsInfo,
  ]);
};
