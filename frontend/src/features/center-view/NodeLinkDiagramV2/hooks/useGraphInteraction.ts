import { useInteractionStore } from "@/stores/useInteractionStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { GraphLink, GraphNode, ViewNode } from "@/types";
import { useCallback, useEffect, useRef } from "react";

// Maintains the mutable graph state needed during rendering without triggering React rerenders
export function useGraphInteraction({
  nodesById,
  linksById,
  nodeData,
}: {
  nodesById: Map<string, GraphNode>;
  linksById: Map<string, GraphLink>;
  nodeData: Map<string, ViewNode>;
}) {
  const stickyHover = useSettingsStore((s) => s.displaySettings.stickyHover);

  const hoveredNode = useInteractionStore((s) => s.hoveredNode);
  const setHoveredNode = useInteractionStore((s) => s.setHoveredNode);
  const selectedNodes = useInteractionStore((s) => s.selectedNodes);
  const selectNode = useInteractionStore((s) => s.selectNode);

  const hoverNodeRef = useRef<GraphNode | null>(null);
  const neighborNodesRef = useRef<Set<GraphNode>>(new Set());
  const neighborLinksRef = useRef<Set<GraphLink>>(new Set());
  const selectedNodesRef = useRef<Set<GraphNode>>(new Set());

  // Rebuild the hovered node and its neighborhood whenever the hovered ID changes
  // Rendering code reads these refs directly every frame
  useEffect(() => {
    neighborNodesRef.current.clear();
    neighborLinksRef.current.clear();

    const node = hoveredNode ? nodesById.get(hoveredNode) : null;
    hoverNodeRef.current = node ?? null;

    if (node) {
      neighborNodesRef.current.add(node);

      const view = nodeData.get(node.id);
      view?.neighbors.forEach((neighborId) => {
        const neighborNode = nodesById.get(neighborId);
        if (neighborNode) neighborNodesRef.current.add(neighborNode);
      });
      view?.links.forEach((linkId) => {
        const link = linksById.get(linkId);
        if (link) neighborLinksRef.current.add(link);
      });
    }
  }, [hoveredNode, nodesById, linksById, nodeData]);

  // Selection is tracked independently from hover
  // (unlike hover, selecting a node does not highlight its neighbors)
  useEffect(() => {
    const next = new Set<GraphNode>();
    selectedNodes.forEach((id) => {
      const node = nodesById.get(id);
      if (node) next.add(node);
    });
    selectedNodesRef.current = next;
  }, [selectedNodes, nodesById]);

  const handleNodeHover = useCallback(
    (node: GraphNode | null) => {
      if (node) {
        setHoveredNode(node.id);
        return;
      }
      if (!stickyHover) setHoveredNode(null);
    },
    [setHoveredNode, stickyHover],
  );

  // Shift/Ctrl/Cmd enable multi-selection
  const handleNodeClick = useCallback(
    (node: GraphNode, event: MouseEvent) => {
      selectNode(node.id, event.shiftKey || event.ctrlKey || event.metaKey);
    },
    [selectNode],
  );

  return {
    hoverNodeRef,
    neighborNodesRef,
    neighborLinksRef,
    selectedNodesRef,
    handleNodeHover,
    handleNodeClick,
  };
}
