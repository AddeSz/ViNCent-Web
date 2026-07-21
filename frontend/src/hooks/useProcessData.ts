import { useFilterStore } from "@/stores/useFilterStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { DataChanges, FullData } from "@/types";
import { getNodeId } from "@/utils/utils";
import { useMemo, useRef, useState } from "react";

export const useProcessData = (
  nodeData: Map<string, FullData>,
  edgeData: Map<string, FullData>,
  changes: DataChanges,
  edgeChanges: DataChanges,
) => {
  const previewChanges = useSettingsStore(
    (s) => s.displaySettings.previewChanges,
  );
  const networkData = useNetworkStore((s) => s.network);
  const hiddenNodes = useFilterStore((s) => s.hiddenNodes);
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
    const processedNodeData = new Map<string, FullData>();
    const activeNodeIds = new Set<string>();

    for (const [id, node] of nodeData) {
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

      processedNodeData.set(id, processedNode);

      if (!processedNode.removed) {
        activeNodeIds.add(processedNode.id!);
      }
    }

    const processedEdgeData = new Map<string, FullData>();

    for (const [edgeId, edge] of edgeData) {
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

      processedEdgeData.set(edgeId, processedEdge);
    }

    const renderableNodes = networkData.nodes.filter(
      (node) => activeNodeIds.has(node.id) && !hiddenNodes.has(node.id),
    );

    const renderableLinks = networkData.edges.filter((link) => {
      const s = getNodeId(link.source);
      const t = getNodeId(link.target);
      const edge = processedEdgeData.get(link.id);
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
    for (const link of renderableLinks) {
      const s = getNodeId(link.source);
      const t = getNodeId(link.target);
      const edge = processedEdgeData.get(link.id);

      if (edge && !edge.removed) {
        const sourceNode = processedNodeData.get(s);
        const targetNode = processedNodeData.get(t);

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
      const node = processedNodeData.get(id);
      if (node) {
        processedNodeData.set(id, {
          ...node,
          linkCount: count,
          linked: new Set(node.linked),
        });
      }
    }

    const fullNodeData = new Map<string, FullData>();
    for (const [id, node] of processedNodeData) {
      fullNodeData.set(id, {
        ...node,
        hidden: hiddenNodes.has(id),
      });
    }

    const fullEdgeData = new Map<string, FullData>();
    for (const [edgeId, edge] of processedEdgeData) {
      const [s, t] = edgeId.split("|");
      const isHidden = hiddenNodes.has(s) || hiddenNodes.has(t);

      fullEdgeData.set(edgeId, {
        ...edge,
        hidden: isHidden,
      });
    }

    const visibleEdgeData = new Map<string, FullData>();
    for (const [edgeId, edge] of fullEdgeData) {
      if (!edge.removed && !edge.hidden) {
        visibleEdgeData.set(edgeId, edge);
      }
    }

    const visibleNodeData = new Map<string, FullData>();
    for (const [id, node] of fullNodeData) {
      if (!node.removed && !node.hidden) {
        visibleNodeData.set(id, node);
      }
    }

    return {
      fullNodeData,
      fullEdgeData,
      visibleNodeData,
      visibleEdgeData,
      renderableNetwork: { nodes: renderableNodes, edges: renderableLinks },
    };
  }, [
    nodeData,
    edgeData,
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
