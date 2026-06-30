import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { DataChanges, FullData } from "@/types";
import { getNodeId } from "@/utils/utils";
import { useMemo, useRef, useState } from "react";

export const useProcessData = (
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
    const activeNodeIds = new Set<string>();

    for (const [id, node] of nodeMap) {
      const isAccepted = node.pendingRemoval && acceptedRemovals.has(node.id!);

      const processedNode = {
        ...(isAccepted
          ? {
              id: node.id,
              label: node.label,
              linkCount: node.linkCount,
              pendingRemoval: false,
              removed: true,
            }
          : node),
        linkCount: 0,
        linked: new Set<string>(),
      };

      dataMap.set(id, processedNode);

      if (!processedNode.removed) {
        activeNodeIds.add(processedNode.id!);
      }
    }

    const processedEdgeMap = new Map<string, FullData>();

    for (const [edgeId, edge] of edgeMap) {
      const [s, t] = edgeId.split("|");
      const isAcceptedEdge =
        edge.pendingRemoval && acceptedEdgeRemovals.has(edgeId);

      const shouldRemove = !activeNodeIds.has(s) || !activeNodeIds.has(t);

      const processedEdge = isAcceptedEdge
        ? { ...edge, pendingRemoval: false, removed: true }
        : shouldRemove || edge.removed
          ? {
              ...edge,
              pendingRemoval: shouldRemove && !edge.removed,
              removed: edge.removed || shouldRemove,
            }
          : { ...edge };

      processedEdgeMap.set(edgeId, processedEdge);
    }

    const filteredNodes = networkData.nodes.filter(
      (node) => activeNodeIds.has(node.id) && !hiddenNodes.has(node.id),
    );

    const filteredLinks = networkData.edges.filter((link) => {
      const s = getNodeId(link.source);
      const t = getNodeId(link.target);
      const edge = processedEdgeMap.get(link.id);
      return (
        !hiddenNodes.has(s) &&
        !hiddenNodes.has(t) &&
        edge &&
        !edge.removed &&
        activeNodeIds.has(s) &&
        activeNodeIds.has(t)
      );
    });

    const linkCountMap = new Map<string, number>();
    for (const link of filteredLinks) {
      const s = getNodeId(link.source);
      const t = getNodeId(link.target);
      const edge = processedEdgeMap.get(link.id);

      if (edge && !edge.removed) {
        const sourceNode = dataMap.get(s);
        const targetNode = dataMap.get(t);

        if (
          sourceNode &&
          targetNode &&
          !sourceNode.removed &&
          !targetNode.removed &&
          !hiddenNodes.has(s) &&
          !hiddenNodes.has(t)
        ) {
          linkCountMap.set(s, (linkCountMap.get(s) || 0) + 1);
          linkCountMap.set(t, (linkCountMap.get(t) || 0) + 1);

          if (sourceNode.linked && targetNode.linked) {
            sourceNode.linked.add(t);
            targetNode.linked.add(s);
          }
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

    const fullNodeData = new Map<string, FullData>();
    for (const [id, node] of dataMap) {
      fullNodeData.set(id, {
        ...node,
        hidden: hiddenNodes.has(id),
      });
    }

    const fullEdgeData = new Map<string, FullData>();
    for (const [edgeId, edge] of processedEdgeMap) {
      const [s, t] = edgeId.split("|");
      const isHidden = hiddenNodes.has(s) || hiddenNodes.has(t);

      fullEdgeData.set(edgeId, {
        ...edge,
        hidden: isHidden,
      });
    }

    const filteredEdgeData = new Map<string, FullData>();
    for (const [edgeId, edge] of fullEdgeData) {
      if (!edge.removed && !edge.hidden) {
        filteredEdgeData.set(edgeId, edge);
      }
    }

    const filteredNodeData = new Map<string, FullData>();
    for (const [id, node] of fullNodeData) {
      if (!node.removed && !node.hidden) {
        filteredNodeData.set(id, node);
      }
    }

    return {
      nodeData: fullNodeData,
      edgeData: fullEdgeData,
      filteredNodeData,
      filteredEdgeData,
      filteredNetwork: { nodes: filteredNodes, edges: filteredLinks },
    };
  }, [
    nodeMap,
    edgeMap,
    acceptedRemovals,
    acceptedEdgeRemovals,
    hiddenNodes,
    networkData,
  ]);

  const confirmRemovals = () => {
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

  const canConfirm =
    (unacceptedRemovals.length > 0 || unacceptedEdgeRemovals.length > 0) &&
    previewChanges;

  return { ...result, confirmRemovals, canConfirm };
};
