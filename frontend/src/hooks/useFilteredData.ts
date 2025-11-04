import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { FullData, NodeChange } from "@/types/network";
import { diffNodes } from "@/utils/diffNodes";
import { useMemo, useRef } from "react";

const emptyChanges: NodeChange = { added: {}, removed: {}, updated: {} };

export const useFilteredData = (): {
  fullData: FullData[];
  changes: NodeChange;
} => {
  const nodeData = useNetworkStore((s) => s.nodeMap);
  const metricsData = useMetricsStore((s) => s.metricsData);
  const enabledMetricsKeys = useMetricsStore((s) => s.enabledMetricsKeys);
  const brushRanges = useMetricsStore((s) => s.brushRanges);
  const selectedCategories = useMetricsStore((s) => s.selectedCategories);

  const keepPreviewNodes = useSettingsStore(
    (s) => s.displaySettings.keepPreviewNodes,
  );
  const keepStable = useSettingsStore((s) => s.displaySettings.keepStableView);

  const prevNodeMapRef = useRef<Map<string, FullData> | null>(null);
  const prevChangesRef = useRef<NodeChange>(emptyChanges);

  return useMemo(() => {
    const currentMap = new Map<string, FullData>();

    nodeData.forEach((baseNode, id) => {
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
        }
      }

      const { vx, vy, x, y, attributes, index, ...filteredBaseNode } = baseNode;

      currentMap.set(id, {
        ...filteredBaseNode,
        ...filteredMetrics,
        removed: false,
        stable: false,
      });
    });

    const prevMap = prevNodeMapRef.current || new Map();
    const changes = diffNodes(prevMap, currentMap);

    const hasChanges =
      Object.keys(changes.added || {}).length > 0 ||
      Object.keys(changes.removed || {}).length > 0 ||
      Object.keys(changes.updated || {}).length > 0;

    if (hasChanges) {
      prevNodeMapRef.current = new Map(currentMap);
      prevChangesRef.current = changes;
    }

    const activeChanges = hasChanges
      ? changes
      : prevChangesRef.current || { added: {}, removed: {}, updated: {} };

    const removedSet = new Set(Object.keys(activeChanges.removed ?? {}));
    const ordered: FullData[] = [];

    for (const id of nodeData.keys()) {
      if (currentMap.has(id)) {
        ordered.push(currentMap.get(id)!);
      } else if (removedSet.has(id) && keepPreviewNodes) {
        ordered.push({
          ...activeChanges.removed[id],
          removed: true,
          stable: false,
        });
      } else if (keepStable) {
        const baseNode = nodeData.get(id)!;
        const { vx, vy, x, y, attributes, index, ...filteredBaseNode } =
          baseNode;
        ordered.push({
          ...filteredBaseNode,
          removed: false,
          stable: true,
        });
      }
    }

    if (keepPreviewNodes) {
      for (const removedId of removedSet) {
        if (!ordered.find((n) => n.id === removedId)) {
          ordered.push({
            ...activeChanges.removed[removedId],
            removed: true,
            stable: false,
          });
        }
      }
    }

    return {
      fullData: ordered,
      changes: activeChanges,
    };
  }, [
    nodeData,
    metricsData,
    enabledMetricsKeys,
    brushRanges,
    selectedCategories,
    keepPreviewNodes,
    keepStable,
  ]);
};
