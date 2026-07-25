import { useInteractionStore } from "@/stores/useInteractionStore";
import { useNetworkStore } from "@/stores/useNetworkStore";
import { type ViewEdge, type ViewNode } from "@/types";
import { getNodeId } from "@/utils/utils";
import { useMemo } from "react";

interface DataSummaryProps {
  nodeData: Map<string, ViewNode>;
  edgeData: Map<string, ViewEdge>;
}

const DataSummary = ({ nodeData, edgeData }: DataSummaryProps) => {
  const selectedNodes = useInteractionStore((s) => s.selectedNodes);
  const fullNetwork = useNetworkStore((s) => s.fullNetwork);

  const { selectedNodesCount, selectedLinksCount } = useMemo(() => {
    if (!selectedNodes || selectedNodes.size === 0) {
      return { selectedNodesCount: 0, selectedLinksCount: 0 };
    }

    let nodesCount = 0;
    const uniqueLinks = new Set<string>();

    for (const nodeId of selectedNodes) {
      if (nodeData.has(nodeId)) {
        nodesCount++;
      }
    }

    for (const link of edgeData.values()) {
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
  }, [selectedNodes, nodeData, edgeData]);

  if (fullNetwork.nodes.length === 0) return null;

  return (
    <div className="pointer-events-none mt-2 cursor-default text-sm text-gray-300">
      <p>
        Visible Nodes: {nodeData.size} / {fullNetwork.nodes.length}
      </p>
      <p>
        Visible Links: {edgeData.size} / {fullNetwork.edges.length}
      </p>
      <p>
        Selected: {selectedNodesCount} nodes, {selectedLinksCount} links
      </p>
    </div>
  );
};

export default DataSummary;
