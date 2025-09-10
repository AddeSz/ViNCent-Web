import { useMemo } from "react";
import type { Node, Edge } from "@/types/network";

export const useNodeLinkData = (
  networkData: { nodes: Node[]; edges: Edge[] },
  filteredCentralityData: { id: string }[] | null,
) => {
  return useMemo(() => {
    if (!filteredCentralityData || filteredCentralityData.length === 0) {
      return { nodes: [], edges: [] };
    }

    const validNodeIds = new Set(filteredCentralityData.map((item) => item.id));
    const filteredNodes = networkData.nodes.filter((node) =>
      validNodeIds.has(node.id),
    );

    const getNodeId = (node: string | Node) =>
      typeof node === "string" ? node : node.id;
    const filteredEdges = networkData.edges.filter(
      (edge) =>
        validNodeIds.has(getNodeId(edge.source)) &&
        validNodeIds.has(getNodeId(edge.target)),
    );

    return { nodes: filteredNodes, edges: filteredEdges };
  }, [networkData, filteredCentralityData]);
};
