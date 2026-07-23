import { useFilterStore } from "@/stores/useFilterStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { DataChanges, ViewEdge, ViewNode } from "@/types";
import { useMemo, useRef, useState } from "react";

export const useProcessData = (
  flaggedNodeData: Map<string, ViewNode>,
  flaggedEdgeData: Map<string, ViewEdge>,
  changes: DataChanges,
  edgeChanges: DataChanges,
) => {
  const previewChanges = useSettingsStore(
    (s) => s.displaySettings.previewChanges,
  );
  const fullNetwork = useNetworkStore((s) => s.fullNetwork);
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
    const processedNodeData = new Map<string, ViewNode>();
    const activeNodeIds = new Set<string>();

    for (const [id, node] of flaggedNodeData) {
      const isAccepted =
        node.flags.pendingRemoval && acceptedRemovals.has(node.id);

      const processedNode: ViewNode = isAccepted
        ? {
            id: node.id,
            label: node.label,
            attributes: node.attributes,
            flags: { removed: true, pendingRemoval: false, hidden: false },
            linked: new Set(),
          }
        : { ...node, linked: new Set() };

      processedNodeData.set(id, processedNode);

      if (!processedNode.flags.removed) {
        activeNodeIds.add(processedNode.id);
      }
    }

    const processedEdgeData = new Map<string, ViewEdge>();

    for (const [edgeId, edge] of flaggedEdgeData) {
      const isAcceptedEdge =
        edge.flags.pendingRemoval && acceptedEdgeRemovals.has(edgeId);

      const shouldRemove =
        !activeNodeIds.has(edge.source) || !activeNodeIds.has(edge.target);

      const processedEdge: ViewEdge = isAcceptedEdge
        ? {
            ...edge,
            flags: { removed: true, pendingRemoval: false, hidden: false },
          }
        : shouldRemove || edge.flags.removed
          ? {
              ...edge,
              flags: {
                ...edge.flags,
                pendingRemoval: shouldRemove && !edge.flags.removed,
                removed: edge.flags.removed || shouldRemove,
              },
            }
          : { ...edge };

      processedEdgeData.set(edgeId, processedEdge);
    }

    const renderableNodes = fullNetwork.nodes.filter(
      (node) => activeNodeIds.has(node.id) && !hiddenNodes.has(node.id),
    );

    const renderableLinks = fullNetwork.edges.filter((link) => {
      const edge = processedEdgeData.get(link.id);
      return (
        !hiddenNodes.has(link.source) &&
        !hiddenNodes.has(link.target) &&
        edge &&
        !edge.flags.removed &&
        activeNodeIds.has(link.source) &&
        activeNodeIds.has(link.target)
      );
    });

    const linkCountMap = new Map<string, number>();
    for (const link of renderableLinks) {
      const edge = processedEdgeData.get(link.id);

      if (edge && !edge.flags.removed) {
        const sourceNode = processedNodeData.get(link.source);
        const targetNode = processedNodeData.get(link.target);

        if (
          sourceNode &&
          targetNode &&
          !sourceNode.flags.removed &&
          !targetNode.flags.removed &&
          !hiddenNodes.has(link.source) &&
          !hiddenNodes.has(link.target)
        ) {
          linkCountMap.set(
            link.source,
            (linkCountMap.get(link.source) || 0) + 1,
          );
          linkCountMap.set(
            link.target,
            (linkCountMap.get(link.target) || 0) + 1,
          );

          sourceNode.linked.add(link.target);
          targetNode.linked.add(link.source);
        }
      }
    }

    const viewNodeData = new Map<string, ViewNode>();
    for (const [id, node] of processedNodeData) {
      viewNodeData.set(id, {
        ...node,
        flags: { ...node.flags, hidden: hiddenNodes.has(id) },
      });
    }

    const viewEdgeData = new Map<string, ViewEdge>();
    for (const [edgeId, edge] of processedEdgeData) {
      const isHidden =
        hiddenNodes.has(edge.source) || hiddenNodes.has(edge.target);

      viewEdgeData.set(edgeId, {
        ...edge,
        flags: { ...edge.flags, hidden: isHidden },
      });
    }

    const visibleEdgeData = new Map<string, ViewEdge>();
    for (const [edgeId, edge] of viewEdgeData) {
      if (!edge.flags.removed && !edge.flags.hidden) {
        visibleEdgeData.set(edgeId, edge);
      }
    }

    const visibleNodeData = new Map<string, ViewNode>();
    for (const [id, node] of viewNodeData) {
      if (!node.flags.removed && !node.flags.hidden) {
        visibleNodeData.set(id, node);
      }
    }

    return {
      viewNodeData,
      viewEdgeData,
      visibleNodeData,
      visibleEdgeData,
      renderableNetwork: { nodes: renderableNodes, edges: renderableLinks },
    };
  }, [
    flaggedNodeData,
    flaggedEdgeData,
    acceptedRemovals,
    acceptedEdgeRemovals,
    hiddenNodes,
    fullNetwork,
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
