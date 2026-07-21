import type { BinnedData } from "@/features/chart-filtering/components/createBinnedData";
import { useFilterStore, type BrushRange } from "@/stores/useFilterStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { AttributeInfo, Attributes, DataChanges, FullData } from "@/types";
import { diffData } from "@/utils/diffData";
import { useMemo, useRef } from "react";
import { useKeys } from "./useKeys";

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
  nodeData: Map<string, FullData>;
  edgeData: Map<string, FullData>;
  nodeChanges: DataChanges;
  edgeChanges: DataChanges;
} => {
  const allNodesById = useNetworkStore((s) => s.allNodesById);
  const allEdgesById = useNetworkStore((s) => s.allEdgesById);
  const currentNodes = useNetworkStore((s) => s.currentNodes);
  const currentEdges = useNetworkStore((s) => s.currentEdges);
  const metricsInfo = useNetworkStore((s) => s.metricsInfo);

  const brushRanges = useFilterStore((s) => s.brushRanges);
  const selectedCategories = useFilterStore((s) => s.selectedCategories);
  const binnedDataByKey = useFilterStore((s) => s.binnedDataByKey);
  const disabledValues = useFilterStore((s) => s.disabledValues);

  const { enabledEdgeKeys, enabledNodeKeys } = useKeys();

  const previewChanges = useSettingsStore(
    (s) => s.displaySettings.previewChanges,
  );
  const showForeshadowing = useSettingsStore(
    (s) => s.displaySettings.showForeshadowing,
  );

  const prevPassingNodeDataRef = useRef<Map<string, FullData> | null>(null);
  const prevChangesRef = useRef<DataChanges>(emptyChanges);
  const prevPassingEdgeDataRef = useRef<Map<string, FullData> | null>(null);
  const prevEdgeChangesRef = useRef<DataChanges>(emptyChanges);

  const prevAllNodesByIdRef = useRef(allNodesById);
  if (allNodesById !== prevAllNodesByIdRef.current) {
    prevAllNodesByIdRef.current = allNodesById;
    prevPassingNodeDataRef.current = null;
    prevChangesRef.current = emptyChanges;
    prevPassingEdgeDataRef.current = null;
    prevEdgeChangesRef.current = emptyChanges;
  }

  const prevAllEdgesByIdRef = useRef(allEdgesById);
  if (allEdgesById !== prevAllEdgesByIdRef.current) {
    prevAllEdgesByIdRef.current = allEdgesById;
    prevPassingNodeDataRef.current = null;
    prevChangesRef.current = emptyChanges;
    prevPassingEdgeDataRef.current = null;
    prevEdgeChangesRef.current = emptyChanges;
  }

  return useMemo(() => {
    let i = 0;
    const passingNodeData = new Map<string, FullData>();

    currentNodes.forEach((node, id) => {
      i++;
      const metrics = node.attributes || {};

      const matchesFilters = matchesAllFilters(
        metrics,
        enabledNodeKeys,
        brushRanges,
        disabledValues,
        selectedCategories,
        metricsInfo,
        binnedDataByKey,
      );

      if (!matchesFilters) return;

      const filteredMetrics: Record<string, any> = {};
      for (const key of enabledNodeKeys) {
        if (key in metrics) {
          filteredMetrics[key] = metrics[key];
        } else {
          filteredMetrics[key] = null;
        }
      }

      passingNodeData.set(id, {
        id: node.id,
        label: node.label,
        ...filteredMetrics,
        pendingRemoval: false,
        removed: false,
        index: i - 1,
      });
    });

    i = 0;
    const passingEdgeData = new Map<string, FullData>();
    currentEdges.forEach((edge, edgeId) => {
      const [source, target] = edgeId.split("|");

      if (!passingNodeData.has(source) || !passingNodeData.has(target)) {
        return;
      }

      i++;
      const metrics = edge.attributes || {};

      const matchesFilters = matchesAllFilters(
        metrics,
        enabledEdgeKeys,
        brushRanges,
        disabledValues,
        selectedCategories,
        metricsInfo,
        binnedDataByKey,
      );

      if (!matchesFilters) return;

      const filteredMetrics: Record<string, any> = {};
      for (const key of enabledEdgeKeys) {
        if (key in metrics) {
          filteredMetrics[key] = metrics[key];
        } else {
          filteredMetrics[key] = null;
        }
      }

      passingEdgeData.set(edgeId, {
        id: edgeId,
        ...filteredMetrics,
        pendingRemoval: false,
        removed: false,
        index: i - 1,
      });
    });

    const prevPassingNodeData = prevPassingNodeDataRef.current || new Map();
    const nodeChanges = diffData(prevPassingNodeData, passingNodeData);

    const hasChanges =
      Object.keys(nodeChanges.added || {}).length > 0 ||
      Object.keys(nodeChanges.removed || {}).length > 0 ||
      Object.keys(nodeChanges.updated || {}).length > 0;

    if (hasChanges) {
      prevPassingNodeDataRef.current = new Map(passingNodeData);
      prevChangesRef.current = nodeChanges;
    }

    const activeNodeChanges = hasChanges
      ? nodeChanges
      : prevChangesRef.current || emptyChanges;

    const prevPassingEdgeData = prevPassingEdgeDataRef.current || new Map();
    const edgeChanges = diffData(prevPassingEdgeData, passingEdgeData);

    const hasEdgeChanges =
      Object.keys(edgeChanges.added || {}).length > 0 ||
      Object.keys(edgeChanges.removed || {}).length > 0 ||
      Object.keys(edgeChanges.updated || {}).length > 0;

    if (hasEdgeChanges) {
      prevPassingEdgeDataRef.current = new Map(passingEdgeData);
      prevEdgeChangesRef.current = edgeChanges;
    }

    const activeEdgeChanges = hasEdgeChanges
      ? edgeChanges
      : prevEdgeChangesRef.current || emptyChanges;

    const removedNodeSet = new Set(
      Object.keys(activeNodeChanges.removed ?? {}),
    );
    const nodeData = new Map<string, FullData>();
    const baseNodeSource = showForeshadowing ? allNodesById : currentNodes;

    for (const id of allNodesById.keys()) {
      if (passingNodeData.has(id)) {
        nodeData.set(id, passingNodeData.get(id)!);
      } else if (baseNodeSource.has(id)) {
        const baseNode = baseNodeSource.get(id)!;

        if (previewChanges && removedNodeSet.has(id)) {
          nodeData.set(id, {
            ...activeNodeChanges.removed[id],
            pendingRemoval: true,
            removed: false,
          });
        } else {
          nodeData.set(id, {
            id,
            label: baseNode.label,
            pendingRemoval: false,
            removed: true,
          });
        }
      } else if (previewChanges && removedNodeSet.has(id)) {
        nodeData.set(id, {
          ...activeNodeChanges.removed[id],
          pendingRemoval: true,
          removed: false,
        });
      }
    }

    const removedEdgeSet = new Set(
      Object.keys(activeEdgeChanges.removed ?? {}),
    );
    const edgeData = new Map<string, FullData>();

    for (const edgeId of currentEdges.keys()) {
      if (passingEdgeData.has(edgeId)) {
        edgeData.set(edgeId, passingEdgeData.get(edgeId)!);
      } else {
        if (previewChanges && removedEdgeSet.has(edgeId)) {
          edgeData.set(edgeId, {
            ...activeEdgeChanges.removed[edgeId],
            pendingRemoval: true,
            removed: false,
          });
        } else {
          edgeData.set(edgeId, {
            id: edgeId,
            pendingRemoval: false,
            removed: true,
          });
        }
      }
    }

    if (previewChanges) {
      for (const edgeId of removedEdgeSet) {
        if (!edgeData.has(edgeId)) {
          edgeData.set(edgeId, {
            ...activeEdgeChanges.removed[edgeId],
            pendingRemoval: true,
            removed: false,
          });
        }
      }
    }

    return {
      nodeData,
      edgeData,
      nodeChanges: activeNodeChanges,
      edgeChanges: activeEdgeChanges,
    };
  }, [
    allNodesById,
    allEdgesById,
    currentNodes,
    currentEdges,
    enabledNodeKeys,
    brushRanges,
    disabledValues,
    binnedDataByKey,
    selectedCategories,
    previewChanges,
    showForeshadowing,
    enabledEdgeKeys,
    metricsInfo,
  ]);
};
