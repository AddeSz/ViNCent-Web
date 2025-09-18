import type { Link, Node } from "@/types/network";
import { getNodeId } from "@/utils/utils";
import { useMemo } from "react";

export const useNodeLinkData = (
  networkData: { nodes: Node[]; links: Link[] },
  filteredCentralityData: { id: string }[] | null,
) => {
  return useMemo(() => {
    if (!filteredCentralityData || filteredCentralityData.length === 0) {
      return { nodes: [], links: [] };
    }

    const validNodeIds = new Set(filteredCentralityData.map((item) => item.id));
    const filteredNodes = networkData.nodes.filter((node) =>
      validNodeIds.has(node.id),
    );

    const filteredLinks = networkData.links.filter(
      (link) =>
        validNodeIds.has(getNodeId(link.source)) &&
        validNodeIds.has(getNodeId(link.target)),
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [networkData, filteredCentralityData]);
};
