import { useInteractionStore } from "@/stores/useInteractionStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { type Network } from "@/types";
import { getNodeId } from "@/utils/utils";
import { useMemo } from "react";

interface DataSummaryProps {
  renderableNetwork: Network;
}

const DataSummary = ({ renderableNetwork }: DataSummaryProps) => {
  const selectedNodes = useInteractionStore((s) => s.selectedNodes);
  const network = useNetworkStore((s) => s.network);

  const { selectedNodesCount, selectedLinksCount } = useMemo(() => {
    if (!selectedNodes || selectedNodes.size === 0) {
      return { selectedNodesCount: 0, selectedLinksCount: 0 };
    }

    let nodesCount = 0;
    const uniqueLinks = new Set<string>();

    for (const node of renderableNetwork.nodes) {
      if (selectedNodes.has(node.id)) {
        nodesCount++;
      }
    }

    for (const link of renderableNetwork.edges) {
      const sourceId = getNodeId(link.source);
      const targetId = getNodeId(link.target);

      if (selectedNodes.has(sourceId) || selectedNodes.has(targetId)) {
        uniqueLinks.add(link.id);
      }
    }

    return {
      selectedNodesCount: nodesCount,
      selectedLinksCount: uniqueLinks.size,
    };
  }, [selectedNodes, renderableNetwork]);

  if (network.nodes.length === 0) return null;
  return (
    <div className="pointer-events-none mt-2 cursor-default text-sm text-gray-300">
      <p>
        Visible Nodes: {renderableNetwork.nodes.length} / {network.nodes.length}
      </p>
      <p>
        Visible Links: {renderableNetwork.edges.length} / {network.edges.length}
      </p>
      <p>
        Selected: {selectedNodesCount} nodes, {selectedLinksCount} links
      </p>
    </div>
  );
};

export default DataSummary;
