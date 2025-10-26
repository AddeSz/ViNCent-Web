import { useChartSettings } from "@/stores/useChartSettingsStore";
import { useMetricsStore } from "@/stores/useMetricsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type { FullData, NodeChange } from "@/types/network";
import { diffNodes } from "@/utils/diffNodes";
import { useMemo, useRef } from "react";

export const useFullData = (): {
  fullData: FullData[];
  changes: NodeChange | null;
} => {
  const nodeData = useNetworkStore((s) => s.nodeMap);
  const metricsData = useMetricsStore((s) => s.filteredMetricsData);
  const keepPreviewNodes = useChartSettings(
    (s) => s.displaySettings.keepPreviewNodes,
  );
  const keepStable = useChartSettings((s) => s.displaySettings.keepStableView);

  const prevNodeMapRef = useRef<Map<string, FullData> | null>(null);
  const prevChangesRef = useRef<NodeChange | null>(null);

  return useMemo(() => {
    const currentMap = new Map<string, FullData>();

    nodeData.forEach((baseNode, id) => {
      const metrics = metricsData.get(id);
      const { vx, vy, x, y, attributes, index, ...filteredBaseNode } = baseNode;

      if (!metrics) return;

      currentMap.set(id, {
        ...filteredBaseNode,
        ...metrics,
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
  }, [nodeData, metricsData, keepPreviewNodes, keepStable]);
};
