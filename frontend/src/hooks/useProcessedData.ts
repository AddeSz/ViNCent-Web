import { useChartSettings } from "@/stores/useChartSettingsStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import type { FullData, Network, NodeChange } from "@/types/network";
import { getNodeId } from "@/utils/utils";
import { useMemo, useRef, useState } from "react";

export const useProcessedData = (
  fullData: FullData[],
  changes: NodeChange | null,
) => {
  const keepStable = useChartSettings((s) => s.displaySettings.keepStableView);
  const keepDeletedNodes = useChartSettings(
    (s) => s.displaySettings.keepPreviewNodes,
  );

  const networkData = useNetworkStore((s) => s.network);
  const hiddenNodes = useNetworkStore((s) => s.hiddenNodes);

  const [acceptedRemovals, setAcceptedRemovals] = useState<Set<string>>(
    new Set(),
  );
  const lastChangesRef = useRef(changes);

  if (changes !== lastChangesRef.current) {
    lastChangesRef.current = changes;
    if (acceptedRemovals.size > 0) setAcceptedRemovals(new Set());
  }

  const result = useMemo(() => {
    const processedData: FullData[] = [];
    const dataMap = new Map<string, FullData>();
    const validNodeIds = new Set<string>();

    for (const node of fullData) {
      let processedNode: FullData | null = node;

      if (node.removed && acceptedRemovals.has(node.id!)) {
        if (keepStable) {
          processedNode = {
            id: node.id,
            label: node.label,
            linkCount: node.linkCount,
            removed: false,
            stable: true,
          } as FullData;
        } else {
          processedNode = null;
        }
      }

      if (processedNode) {
        const isHidden = hiddenNodes.has(processedNode.id!);
        const nodeWithHidden = {
          ...processedNode,
          hidden: isHidden,
          linkCount: 0,
        };
        processedData.push(nodeWithHidden);
        dataMap.set(nodeWithHidden.id!, nodeWithHidden);

        if (!nodeWithHidden.stable) validNodeIds.add(nodeWithHidden.id!);
      }
    }

    const filteredNodes = networkData.nodes.filter(
      (node) => validNodeIds.has(node.id) && !hiddenNodes.has(node.id),
    );

    const filteredLinks = networkData.links.filter((link) => {
      const s = getNodeId(link.source);
      const t = getNodeId(link.target);
      return (
        validNodeIds.has(s) &&
        validNodeIds.has(t) &&
        !hiddenNodes.has(s) &&
        !hiddenNodes.has(t)
      );
    });

    const linkCountMap = new Map<string, number>();
    for (const link of filteredLinks) {
      const s = getNodeId(link.source);
      const t = getNodeId(link.target);
      linkCountMap.set(s, (linkCountMap.get(s) || 0) + 1);
      linkCountMap.set(t, (linkCountMap.get(t) || 0) + 1);
    }

    for (const [id, count] of linkCountMap) {
      const node = dataMap.get(id);
      if (node) dataMap.set(id, { ...node, linkCount: count });
    }

    const filteredNetwork: Network = {
      nodes: filteredNodes,
      links: filteredLinks,
    };

    return { data: processedData, dataMap, filteredNetwork, linkCountMap };
  }, [
    fullData,
    acceptedRemovals,
    keepStable,
    networkData.nodes,
    networkData.links,
    hiddenNodes,
  ]);

  const handlePreview = () => {
    if (!changes) return;
    const removedIds = Object.keys(changes.removed ?? {});
    if (removedIds.length > 0) {
      setAcceptedRemovals((prev) => {
        const next = new Set(prev);
        removedIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const removedIds = changes ? Object.keys(changes.removed ?? {}) : [];
  const unacceptedRemovals = removedIds.filter(
    (id) => !acceptedRemovals.has(id),
  );
  const canPreview = unacceptedRemovals.length > 0 && keepDeletedNodes;

  return { ...result, handlePreview, canPreview };
};
