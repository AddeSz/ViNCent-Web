import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { DataChanges, FullData, Network } from "@/types/network";
import { getEdgeId, getNodeId } from "@/utils/utils";
import { useMemo, useRef, useState } from "react";

export const useProcessedData = (
  nodeMap: Map<string, FullData>,
  edgeMap: Map<string, FullData>,
  changes: DataChanges,
  edgeChanges: DataChanges,
) => {
  const keepStable = useSettingsStore((s) => s.displaySettings.keepStableView);
  const keepDeletedNodes = useSettingsStore(
    (s) => s.displaySettings.keepPreviewNodes,
  );
  const networkData = useNetworkStore((s) => s.network);
  const hiddenNodes = useNetworkStore((s) => s.hiddenNodes);

  const [acceptedRemovals, setAcceptedRemovals] = useState<Set<string>>(
    new Set(),
  );
  const [acceptedEdgeRemovals, setAcceptedEdgeRemovals] = useState<Set<string>>(
    new Set(),
  );

  const lastChangesRef = useRef(changes);
  const lastEdgeChangesRef = useRef(edgeChanges);

  if (changes !== lastChangesRef.current) {
    lastChangesRef.current = changes;
    if (acceptedRemovals.size > 0) setAcceptedRemovals(new Set());
  }

  if (edgeChanges !== lastEdgeChangesRef.current) {
    lastEdgeChangesRef.current = edgeChanges;
    if (acceptedEdgeRemovals.size > 0) setAcceptedEdgeRemovals(new Set());
  }

  const result = useMemo(() => {
    const dataMap = new Map<string, FullData>();
    const processedEdgeMap = new Map<string, FullData>();
    const validNodeIds = new Set<string>();
    const removedNodeIds = new Set<string>();

    for (const [id, node] of nodeMap) {
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
          linked: new Set<string>(),
        };
        dataMap.set(id, nodeWithHidden);

        if (!nodeWithHidden.stable) {
          validNodeIds.add(nodeWithHidden.id!);
        }

        if (nodeWithHidden.removed || isHidden) {
          removedNodeIds.add(nodeWithHidden.id!);
        }
      }
    }

    const filteredNodes = networkData.nodes.filter(
      (node) => validNodeIds.has(node.id) && !hiddenNodes.has(node.id),
    );
    for (const [edgeId, edge] of edgeMap) {
      const [s, t] = edgeId.split("|");

      let processedEdge = edge;

      const shouldRemove =
        !validNodeIds.has(s) ||
        !validNodeIds.has(t) ||
        hiddenNodes.has(s) ||
        hiddenNodes.has(t);

      if (shouldRemove) {
        processedEdge = {
          ...edge,
          removed: true,
        };
      }

      if (processedEdge.removed && acceptedEdgeRemovals.has(edgeId)) {
        continue;
      }

      processedEdgeMap.set(edgeId, processedEdge);
    }

    const filteredLinks = networkData.links.filter((link) => {
      const s = getNodeId(link.source);
      const t = getNodeId(link.target);
      const edgeId = getEdgeId(link);
      const edge = processedEdgeMap.get(edgeId);
      return (
        !hiddenNodes.has(s) &&
        !hiddenNodes.has(t) &&
        edge &&
        !acceptedEdgeRemovals.has(edgeId)
      );
    });

    const linkCountMap = new Map<string, number>();
    for (const link of filteredLinks) {
      const s = getNodeId(link.source);
      const t = getNodeId(link.target);
      const edgeId = getEdgeId(link);
      const edge = processedEdgeMap.get(edgeId);
      if (edge) {
        linkCountMap.set(s, (linkCountMap.get(s) || 0) + 1);
        linkCountMap.set(t, (linkCountMap.get(t) || 0) + 1);
        const sourceNode = dataMap.get(s);
        const targetNode = dataMap.get(t);
        if (
          sourceNode?.linked &&
          targetNode?.linked &&
          (!sourceNode?.stable || !targetNode?.stable)
        ) {
          sourceNode.linked.add(t);
          targetNode.linked.add(s);
        }
      }
    }

    for (const [id, count] of linkCountMap) {
      const node = dataMap.get(id);
      if (node)
        dataMap.set(id, {
          ...node,
          linkCount: count,
          linked: new Set(node.linked),
        });
    }
    const filteredNetwork: Network = {
      nodes: filteredNodes,
      links: filteredLinks,
    };

    return {
      nodeData: dataMap,
      edgeData: processedEdgeMap,
      filteredNetwork,
      linkCountMap,
    };
  }, [
    nodeMap,
    edgeMap,
    acceptedRemovals,
    acceptedEdgeRemovals,
    keepStable,
    hiddenNodes,
    networkData,
  ]);

  const handlePreview = () => {
    if (changes) {
      const removedIds = Object.keys(changes.removed ?? {});
      if (removedIds.length > 0) {
        setAcceptedRemovals((prev) => {
          const next = new Set(prev);
          removedIds.forEach((id) => next.add(id));
          return next;
        });
      }
    }

    if (edgeChanges) {
      const removedEdgeIds = Object.keys(edgeChanges.removed ?? {});
      if (removedEdgeIds.length > 0) {
        setAcceptedEdgeRemovals((prev) => {
          const next = new Set(prev);
          removedEdgeIds.forEach((id) => next.add(id));
          return next;
        });
      }
    }
  };

  const removedIds = changes ? Object.keys(changes.removed ?? {}) : [];
  const removedEdgeIds = edgeChanges
    ? Object.keys(edgeChanges.removed ?? {})
    : [];

  const unacceptedRemovals = removedIds.filter(
    (id) => !acceptedRemovals.has(id),
  );
  const unacceptedEdgeRemovals = removedEdgeIds.filter(
    (id) => !acceptedEdgeRemovals.has(id),
  );
  const canPreview =
    (unacceptedRemovals.length > 0 || unacceptedEdgeRemovals.length > 0) &&
    keepDeletedNodes;

  return { ...result, handlePreview, canPreview };
};
