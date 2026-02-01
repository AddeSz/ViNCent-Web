import type { BinnedData } from "@/features/chart-filtering/components/createBinnedData";
import { useMetricsStore, type BrushRange } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type {
  AttributeInfo,
  Attributes,
  DataChanges,
  FullData,
} from "@/types/network";
import { diffData } from "@/utils/diffData";
import { useMemo, useRef } from "react";

const emptyChanges: DataChanges = { added: {}, removed: {}, updated: {} };

const matchesAllFilters = (
  metrics: Attributes,
  enabledKeys: string[],
  brushRanges: Record<string, BrushRange | null>,
  disabledValues: Record<string, Set<number | string>>,
  selectedCategories: Record<string, string[]>,
  metricsInfo: Map<string, AttributeInfo>,
  binnedDataByKey: Map<string, BinnedData>,
): boolean => {
  return enabledKeys.every((key) => {
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
          if (binIndex !== undefined && disabledValuesForKey.has(binIndex)) {
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
};

export const useFilterData = (): {
  nodeMap: Map<string, FullData>;
  edgeMap: Map<string, FullData>;
  nodeChanges: DataChanges;
  edgeChanges: DataChanges;
} => {
  const nodeData = useNetworkStore((s) => s.nodeMap);
  const edgeData = useNetworkStore((s) => s.edgeMap);
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

  const prevNodeDataRef = useRef(nodeData);
  if (nodeData !== prevNodeDataRef.current) {
    prevNodeDataRef.current = nodeData;
    prevNodeMapRef.current = null;
    prevChangesRef.current = emptyChanges;
    prevEdgeMapRef.current = null;
    prevEdgeChangesRef.current = emptyChanges;
  }

  const prevEdgeDataRef = useRef(edgeData);
  if (edgeData !== prevEdgeDataRef.current) {
    prevEdgeDataRef.current = edgeData;
    prevNodeMapRef.current = null;
    prevChangesRef.current = emptyChanges;
    prevEdgeMapRef.current = null;
    prevEdgeChangesRef.current = emptyChanges;
  }

  return useMemo(() => {
    let i = 0;
    const currentMap = new Map<string, FullData>();

    currentNodes.forEach((node, id) => {
      i++;
      const metrics = node.attributes || {};

      const matchesFilters = matchesAllFilters(
        metrics,
        enabledNodeMetricsKeys,
        brushRanges,
        disabledValues,
        selectedCategories,
        metricsInfo,
        binnedDataByKey,
      );

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
        pendingRemoval: false,
        removed: false,
        index: i - 1,
      });
    });

    i = 0;
    const validEdgeMap = new Map<string, FullData>();
    currentEdges.forEach((edge, edgeId) => {
      const [source, target] = edgeId.split("|");

      if (!currentMap.has(source) || !currentMap.has(target)) {
        return;
      }

      i++;
      const metrics = edge.attributes || {};

      const matchesFilters = matchesAllFilters(
        metrics,
        enabledEdgeMetricsKeys,
        brushRanges,
        disabledValues,
        selectedCategories,
        metricsInfo,
        binnedDataByKey,
      );

      if (!matchesFilters) return;

      const filteredMetrics: Record<string, any> = {};
      for (const key of enabledEdgeMetricsKeys) {
        if (key in metrics) {
          filteredMetrics[key] = metrics[key];
        } else {
          filteredMetrics[key] = null;
        }
      }

      validEdgeMap.set(edgeId, {
        id: edgeId,
        ...filteredMetrics,
        pendingRemoval: false,
        removed: false,
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
      : prevChangesRef.current || emptyChanges;

    const prevEdgeMap = prevEdgeMapRef.current || new Map();
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
      : prevEdgeChangesRef.current || emptyChanges;

    const removedNodeSet = new Set(
      Object.keys(activeNodeChanges.removed ?? {}),
    );
    const filteredNodes = new Map<string, FullData>();
    const baseNodeSource = showForeshadowing ? nodeData : currentNodes;

    for (const id of nodeData.keys()) {
      if (currentMap.has(id)) {
        filteredNodes.set(id, currentMap.get(id)!);
      } else if (baseNodeSource.has(id)) {
        const baseNode = baseNodeSource.get(id)!;

        if (previewChanges && removedNodeSet.has(id)) {
          filteredNodes.set(id, {
            ...activeNodeChanges.removed[id],
            pendingRemoval: true,
            removed: false,
          });
        } else {
          filteredNodes.set(id, {
            id,
            label: baseNode.label,
            pendingRemoval: false,
            removed: true,
          });
        }
      } else if (previewChanges && removedNodeSet.has(id)) {
        filteredNodes.set(id, {
          ...activeNodeChanges.removed[id],
          pendingRemoval: true,
          removed: false,
        });
      }
    }

    const removedEdgeSet = new Set(
      Object.keys(activeEdgeChanges.removed ?? {}),
    );
    const filteredEdges = new Map<string, FullData>();

    for (const edgeId of currentEdges.keys()) {
      if (validEdgeMap.has(edgeId)) {
        filteredEdges.set(edgeId, validEdgeMap.get(edgeId)!);
      } else {
        if (previewChanges && removedEdgeSet.has(edgeId)) {
          filteredEdges.set(edgeId, {
            ...activeEdgeChanges.removed[edgeId],
            pendingRemoval: true,
            removed: false,
          });
        } else {
          filteredEdges.set(edgeId, {
            id: edgeId,
            pendingRemoval: false,
            removed: true,
          });
        }
      }
    }

    if (previewChanges) {
      for (const edgeId of removedEdgeSet) {
        if (!filteredEdges.has(edgeId)) {
          filteredEdges.set(edgeId, {
            ...activeEdgeChanges.removed[edgeId],
            pendingRemoval: true,
            removed: false,
          });
        }
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
    edgeData,
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
