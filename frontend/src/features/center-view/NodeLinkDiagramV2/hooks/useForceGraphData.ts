import type { GraphLink, GraphNode, Network } from "@/types";
import { useMemo } from "react";

// Creates the graph objects consumed by react-force-graph and
// lookup maps for fast ID object resolution
export function useForceGraphData(fullNetwork: Network) {
  // GraphNode/GraphLink objects are long lived and mutated in place later (labels, colors, etc.)
  // so only recreate them when the underlying network structure changes.
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = fullNetwork.nodes.map((n) => ({
      id: n.id,
      importance: 0,
    }));

    const links: GraphLink[] = fullNetwork.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    }));

    return { nodes, links };
  }, [fullNetwork]);

  const nodesById = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const n of graphData.nodes) map.set(n.id, n);
    return map;
  }, [graphData]);

  const linksById = useMemo(() => {
    const map = new Map<string, GraphLink>();
    for (const l of graphData.links) map.set(l.id, l);
    return map;
  }, [graphData]);

  return { graphData, nodesById, linksById };
}
