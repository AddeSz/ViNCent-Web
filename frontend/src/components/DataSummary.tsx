import { useNetworkStore } from "@/stores/useNetworkStore";
import type { FullData } from "@/types/network";
import { type Network } from "@/types/network";
import { getNodeId } from "@/utils/utils";
import { useMemo } from "react";

interface DataSummaryProps {
  filteredNetwork: Network;
  dataMap: Map<string, FullData>;
}

const DataSummary = ({ filteredNetwork, dataMap }: DataSummaryProps) => {
  const selectedNodes = useNetworkStore((s) => s.selectedNodes);
  const network = useNetworkStore((s) => s.network);

  const { selectedNodesCount, selectedLinksCount } = useMemo(() => {
    if (!selectedNodes || selectedNodes.size === 0) {
      return { selectedNodesCount: 0, selectedLinksCount: 0 };
    }

    let nodesCount = 0;
    const uniqueLinks = new Set<string>();

    for (const [nodeId, data] of dataMap) {
      if (!data.hidden) {
        if (selectedNodes.has(nodeId)) {
          nodesCount++;
        }
      }
    }

    for (const link of filteredNetwork.links) {
      const sourceId = getNodeId(link.source);
      const targetId = getNodeId(link.target);

      if (selectedNodes.has(sourceId) || selectedNodes.has(targetId)) {
        const linkId =
          sourceId < targetId
            ? `${sourceId}-${targetId}`
            : `${targetId}-${sourceId}`;
        uniqueLinks.add(linkId);
      }
    }

    return {
      selectedNodesCount: nodesCount,
      selectedLinksCount: uniqueLinks.size,
    };
  }, [selectedNodes, dataMap, filteredNetwork.links]);

  if (dataMap.size === 0 || network.nodes.length === 0) return null;
  return (
    <div className="pointer-events-none mt-2 cursor-default text-sm text-gray-300">
      <p>
        Visible Nodes: {filteredNetwork.nodes.length} / {network.nodes.length}
      </p>
      <p>
        Visible Links: {filteredNetwork.links.length} / {network.links.length}
      </p>
      <p>
        Selected: {selectedNodesCount} nodes, {selectedLinksCount} links
      </p>
    </div>
  );
};

export default DataSummary;
