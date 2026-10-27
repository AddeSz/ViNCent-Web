import type { GetColorForMetric } from "@/hooks/useGetColorForMetric";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type { GraphNode, ViewNode } from "@/types";
import { useEffect } from "react";
import { DEFAULT_NODE_COLOR } from "../constants";

// derives GraphNode.color from the selected community and mutates
// nodes in place so react-force-graph can keep using the same instances
export function useNodeColoring({
  nodesById,
  nodeData,
  getColorForMetric,
}: {
  nodesById: Map<string, GraphNode>;
  nodeData: Map<string, ViewNode>;
  getColorForMetric: GetColorForMetric;
}) {
  const selectedCommunity = useSettingsStore(
    (s) => s.displaySettings.selectedCommunity,
  );

  useEffect(() => {
    for (const [id, node] of nodesById) {
      if (selectedCommunity === "none") {
        node.color = DEFAULT_NODE_COLOR;
        continue;
      }

      const value = nodeData.get(id)?.attributes[selectedCommunity];
      if (value === undefined || value === null) {
        node.color = DEFAULT_NODE_COLOR;
        continue;
      }

      const color = getColorForMetric(selectedCommunity, value);
      // canvas can't resolve CSS variable
      node.color = color.startsWith("var(") ? DEFAULT_NODE_COLOR : color;
    }
  }, [nodesById, nodeData, selectedCommunity, getColorForMetric]);
}
