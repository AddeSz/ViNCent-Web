import type { BinnedData } from "@/features/chart-filtering/components/createBinnedData";
import { useFilterStore, type BrushRange } from "@/stores/useFilterStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type {
  AttributeInfo,
  Attributes,
  DataChanges,
  ViewEdge,
  ViewNode,
} from "@/types";
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

const noFlags = { removed: false, pendingRemoval: false, hidden: false };

export const useFilterData = (): {
  flaggedNodeData: Map<string, ViewNode>;
  flaggedEdgeData: Map<string, ViewEdge>;
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

  const prevPassingNodeDataRef = useRef<Map<string, ViewNode> | null>(null);
  const prevChangesRef = useRef<DataChanges>(emptyChanges);
  const prevPassingEdgeDataRef = useRef<Map<string, ViewEdge> | null>(null);
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
    const passingNodeData = new Map<string, ViewNode>();

    currentNodes.forEach((node, id) => {
      const metrics = node.attributes;

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

      const filteredMetrics: Attributes = {};
      for (const key of enabledNodeKeys) {
        filteredMetrics[key] = key in metrics ? metrics[key] : (null as any);
      }

      passingNodeData.set(id, {
        id: node.id,
        label: node.label,
        attributes: filteredMetrics,
        flags: { ...noFlags },
        linked: new Set(),
      });
    });

    const passingEdgeData = new Map<string, ViewEdge>();
    currentEdges.forEach((edge, edgeId) => {
      if (
        !passingNodeData.has(edge.source) ||
        !passingNodeData.has(edge.target)
      ) {
        return;
      }

      const metrics = edge.attributes;

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

      const filteredMetrics: Attributes = {};
      for (const key of enabledEdgeKeys) {
        filteredMetrics[key] = key in metrics ? metrics[key] : (null as any);
      }

      passingEdgeData.set(edgeId, {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
        attributes: filteredMetrics,
        flags: { ...noFlags },
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
    const flaggedNodeData = new Map<string, ViewNode>();
    const baseNodeSource = showForeshadowing ? allNodesById : currentNodes;

    for (const id of allNodesById.keys()) {
      if (passingNodeData.has(id)) {
        flaggedNodeData.set(id, passingNodeData.get(id)!);
      } else if (baseNodeSource.has(id)) {
        const baseNode = baseNodeSource.get(id)!;

        if (previewChanges && removedNodeSet.has(id)) {
          const removedNode = activeNodeChanges.removed[id] as ViewNode;
          flaggedNodeData.set(id, {
            ...removedNode,
            flags: { removed: false, pendingRemoval: true, hidden: false },
          });
        } else {
          flaggedNodeData.set(id, {
            id,
            label: baseNode.label,
            attributes: {},
            flags: { removed: true, pendingRemoval: false, hidden: false },
            linked: new Set(),
          });
        }
      } else if (previewChanges && removedNodeSet.has(id)) {
        const removedNode = activeNodeChanges.removed[id] as ViewNode;
        flaggedNodeData.set(id, {
          ...removedNode,
          flags: { removed: false, pendingRemoval: true, hidden: false },
        });
      }
    }

    const removedEdgeSet = new Set(
      Object.keys(activeEdgeChanges.removed ?? {}),
    );
    const flaggedEdgeData = new Map<string, ViewEdge>();

    for (const edgeId of currentEdges.keys()) {
      if (passingEdgeData.has(edgeId)) {
        flaggedEdgeData.set(edgeId, passingEdgeData.get(edgeId)!);
      } else {
        if (previewChanges && removedEdgeSet.has(edgeId)) {
          const removedEdge = activeEdgeChanges.removed[edgeId] as ViewEdge;
          flaggedEdgeData.set(edgeId, {
            ...removedEdge,
            flags: { removed: false, pendingRemoval: true, hidden: false },
          });
        } else {
          const baseEdge = currentEdges.get(edgeId)!;
          flaggedEdgeData.set(edgeId, {
            id: edgeId,
            source: baseEdge.source,
            target: baseEdge.target,
            weight: baseEdge.weight,
            attributes: {},
            flags: { removed: true, pendingRemoval: false, hidden: false },
          });
        }
      }
    }

    if (previewChanges) {
      for (const edgeId of removedEdgeSet) {
        if (!flaggedEdgeData.has(edgeId)) {
          const removedEdge = activeEdgeChanges.removed[edgeId] as ViewEdge;
          flaggedEdgeData.set(edgeId, {
            ...removedEdge,
            flags: { removed: false, pendingRemoval: true, hidden: false },
          });
        }
      }
    }

    return {
      flaggedNodeData,
      flaggedEdgeData,
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
