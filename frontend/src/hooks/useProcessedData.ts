import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { DataChanges, FullData } from "@/types/network";
import { getNodeId } from "@/utils/utils";
import { useMemo, useRef, useState } from "react";

export const useProcessedData = (
  nodeMap: Map<string, FullData>,
  edgeMap: Map<string, FullData>,
  changes: DataChanges,
  edgeChanges: DataChanges,
) => {
  const previewChanges = useSettingsStore(
    (s) => s.displaySettings.previewChanges,
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
    const validNodeIds = new Set<string>();
    const removedNodeIds = new Set<string>();

    for (const [id, node] of nodeMap) {
      const isAccepted = node.removed && acceptedRemovals.has(node.id!);
      const isHidden = hiddenNodes.has(node.id!);

      const processedNode = {
        ...(isAccepted
          ? {
              id: node.id,
              label: node.label,
              linkCount: node.linkCount,
              removed: false,
              stable: true,
            }
          : node),
        hidden: isHidden,
        linkCount: 0,
        linked: new Set<string>(),
      };

      dataMap.set(id, processedNode);

      if (!processedNode.stable) {
        validNodeIds.add(processedNode.id!);
      }

      if (processedNode.removed || isHidden) {
        removedNodeIds.add(processedNode.id!);
      }
    }

    const processedEdgeMap = new Map<string, FullData>();

    for (const [edgeId, edge] of edgeMap) {
      const [s, t] = edgeId.split("|");
      const shouldRemove =
        !validNodeIds.has(s) ||
        !validNodeIds.has(t) ||
        hiddenNodes.has(s) ||
        hiddenNodes.has(t);

      const processedEdge = shouldRemove ? { ...edge, removed: true } : edge;

      if (processedEdge.removed && acceptedEdgeRemovals.has(edgeId)) {
        continue;
      }

      processedEdgeMap.set(edgeId, processedEdge);
    }
    const filteredNodes = networkData.nodes.filter(
      (node) => validNodeIds.has(node.id) && !hiddenNodes.has(node.id),
    );

    const filteredLinks = networkData.edges.filter((link) => {
      const s = getNodeId(link.source);
      const t = getNodeId(link.target);
      const edge = processedEdgeMap.get(link.id);
      return (
        !hiddenNodes.has(s) &&
        !hiddenNodes.has(t) &&
        edge &&
        !acceptedEdgeRemovals.has(link.id)
      );
    });

    const linkCountMap = new Map<string, number>();
    for (const link of filteredLinks) {
      const s = getNodeId(link.source);
      const t = getNodeId(link.target);
      const edge = processedEdgeMap.get(link.id);

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
      if (node) {
        dataMap.set(id, {
          ...node,
          linkCount: count,
          linked: new Set(node.linked),
        });
      }
    }

    return {
      nodeData: dataMap,
      edgeData: processedEdgeMap,
      filteredNetwork: { nodes: filteredNodes, edges: filteredLinks },
      linkCountMap,
    };
  }, [
    nodeMap,
    edgeMap,
    acceptedRemovals,
    acceptedEdgeRemovals,
    hiddenNodes,
    networkData,
  ]);

  const handlePreview = () => {
    const removedIds = Object.keys(changes?.removed ?? {});
    const removedEdgeIds = Object.keys(edgeChanges?.removed ?? {});

    if (removedIds.length > 0) {
      setAcceptedRemovals((prev) => new Set([...prev, ...removedIds]));
    }

    if (removedEdgeIds.length > 0) {
      setAcceptedEdgeRemovals((prev) => new Set([...prev, ...removedEdgeIds]));
    }
  };

  const removedIds = Object.keys(changes?.removed ?? {});
  const removedEdgeIds = Object.keys(edgeChanges?.removed ?? {});

  const unacceptedRemovals = removedIds.filter(
    (id) => !acceptedRemovals.has(id),
  );
  const unacceptedEdgeRemovals = removedEdgeIds.filter(
    (id) => !acceptedEdgeRemovals.has(id),
  );

  const canPreview =
    (unacceptedRemovals.length > 0 || unacceptedEdgeRemovals.length > 0) &&
    previewChanges;

  return { ...result, handlePreview, canPreview };
};
