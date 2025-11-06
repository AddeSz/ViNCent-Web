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
  const metricsData = useMetricsStore((s) => s.metricsData);
  const enabledMetricsKeys = useMetricsStore((s) => s.enabledMetricsKeys);
  const brushRanges = useMetricsStore((s) => s.brushRanges);
  const selectedCategories = useMetricsStore((s) => s.selectedCategories);

  const edgeMetricsData = useMetricsStore((s) => s.edgeMetricsData);
  const enabledEdgeMetricsKeys = useMetricsStore(
    (s) => s.enabledEdgeMetricsKeys,
  );

  const keepPreviewNodes = useSettingsStore(
    (s) => s.displaySettings.keepPreviewNodes,
  );
  const keepStable = useSettingsStore((s) => s.displaySettings.keepStableView);

  const prevNodeMapRef = useRef<Map<string, FullData> | null>(null);
  const prevChangesRef = useRef<DataChanges>(emptyChanges);

  const prevEdgeMapRef = useRef<Map<string, FullData> | null>(null);
  const prevEdgeChangesRef = useRef<DataChanges>(emptyChanges);

  return useMemo(() => {
    let i = 0;
    const currentMap = new Map<string, FullData>();
    nodeData.forEach((baseNode, id) => {
      i++;
      const metrics = metricsData.get(id);
      if (!metrics) return;

      const matchesFilters = enabledMetricsKeys.every((key) => {
        const value = metrics[key];

        const rangeObj = brushRanges[key];
        if (rangeObj && typeof value === "number") {
          const {
            range: [min, max],
            inclusive,
          } = rangeObj;
          const upperBoundCheck = inclusive ? value > max : value >= max;
          if (value < min || upperBoundCheck) return false;
        }

        const selected = selectedCategories[key];
        if (selected && selected.length > 0) {
          if (!selected.includes(String(value))) return false;
        }

        return true;
      });

      if (!matchesFilters) return;

      const filteredMetrics: Record<string, any> = {};
      for (const key of enabledMetricsKeys) {
        if (key in metrics) {
          filteredMetrics[key] = metrics[key];
        } else {
          filteredMetrics[key] = null;
        }
      }

      const { vx, vy, x, y, attributes, history, index, ...filteredBaseNode } =
        baseNode;
      currentMap.set(id, {
        ...filteredBaseNode,
        ...filteredMetrics,
        removed: false,
        stable: false,
        index: i - 1,
      });
    });

    i = 0;
    const currentEdgeMap = new Map<string, FullData>();
    edgeMetricsData.forEach((metrics, edgeId) => {
      i++;
      const matchesFilters = enabledEdgeMetricsKeys.every((key) => {
        const value = metrics[key];

        const rangeObj = brushRanges[key];
        if (rangeObj && typeof value === "number") {
          const {
            range: [min, max],
            inclusive,
          } = rangeObj;
          const upperBoundCheck = inclusive ? value > max : value >= max;
          if (value < min || upperBoundCheck) return false;
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

    const filteredEdges = new Map<string, FullData>(validEdgeMap);

    if (keepPreviewNodes) {
      const removedEdgeSet = new Set(
        Object.keys(activeEdgeChanges.removed ?? {}),
      );
      for (const removedId of removedEdgeSet) {
        if (!filteredEdges.has(removedId)) {
          filteredEdges.set(removedId, {
            ...activeEdgeChanges.removed[removedId],
            removed: true,
            stable: false,
          });
        }
      }
    }

    const removedSet = new Set(Object.keys(activeNodeChanges.removed ?? {}));
    const filteredNodes = new Map<string, FullData>();

    for (const id of nodeData.keys()) {
      if (currentMap.has(id)) {
        filteredNodes.set(id, currentMap.get(id)!);
      } else if (removedSet.has(id) && keepPreviewNodes) {
        filteredNodes.set(id, {
          ...activeNodeChanges.removed[id],
          removed: true,
          stable: false,
        });
      } else if (keepStable) {
        const baseNode = nodeData.get(id)!;
        const { vx, vy, x, y, attributes, index, ...filteredBaseNode } =
          baseNode;
        filteredNodes.set(id, {
          ...filteredBaseNode,
          removed: false,
          stable: true,
        });
      }
    }

    if (keepPreviewNodes) {
      for (const removedId of removedSet) {
        if (!filteredNodes.has(removedId)) {
          filteredNodes.set(removedId, {
            ...activeNodeChanges.removed[removedId],
            removed: true,
            stable: false,
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
    metricsData,
    enabledMetricsKeys,
    brushRanges,
    selectedCategories,
    keepPreviewNodes,
    keepStable,
    edgeMetricsData,
    enabledEdgeMetricsKeys,
  ]);
};
