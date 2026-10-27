import type { Edge, GraphLink, GraphNode, ViewEdge, ViewNode } from "@/types";
import { useCallback, useEffect, type RefObject } from "react";

// sync mutable graph objects with the latest view state
// This updates existing GraphNode/GraphLink instances instead of replacing
// them so react-force-graph can keep using the same objects
export function useGraphSync({
  nodesById,
  linksById,
  nodeData,
  edgeData,
  currentEdges,
  importanceVersionRef,
}: {
  nodesById: Map<string, GraphNode>;
  linksById: Map<string, GraphLink>;
  nodeData: Map<string, ViewNode>;
  edgeData: Map<string, ViewEdge>;
  currentEdges: Map<string, Edge>;
  importanceVersionRef: RefObject<number>;
}) {
  // labels may change independently of graph topology
  useEffect(() => {
    for (const [id, node] of nodesById) {
      const view = nodeData.get(id);
      node.label = view?.label || view?.id;
    }
  }, [nodeData, nodesById]);

  useEffect(() => {
    for (const [id, link] of linksById) {
      const view = edgeData.get(id);
      link.label = view?.label || "";
    }
  }, [edgeData, linksById]);

  // hidden and removed nodes remain in the graph but are not rendered
  const nodeVisibility = useCallback(
    (node: GraphNode) => {
      const view = nodeData.get(node.id);
      return !!view && !view.flags.hidden && !view.flags.removed;
    },
    [nodeData],
  );

  const linkVisibility = useCallback(
    (link: GraphLink) => {
      const view = edgeData.get(link.id);
      return !!view && !view.flags.hidden && !view.flags.removed;
    },
    [edgeData],
  );

  // Recompute node importance from the currently edge set
  // Incrementing the version invalidates cached importance-based sorting used during label rendering
  useEffect(() => {
    const degree = new Map<string, number>();
    for (const edge of currentEdges.values()) {
      degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
      degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
    }

    for (const [id, node] of nodesById) {
      node.importance = degree.get(id) ?? 0;
    }

    importanceVersionRef.current++;
  }, [currentEdges, nodesById]);

  return { nodeVisibility, linkVisibility };
}
