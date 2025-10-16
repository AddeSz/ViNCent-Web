import type { FullData, Link, Node } from "@/types/network";
import { highlightLinksColor } from "@/utils/ColorHelper";
import { getNodeId } from "@/utils/utils";
import * as d3 from "d3";

const selectionStyling = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
  dataMap: Map<string, FullData>,
) => {
  svg
    .selectAll<SVGCircleElement, Node>("circle.node")
    .style("stroke", (d) =>
      selectedNodes.has(d.id) ? highlightLinksColor.selected : "none",
    )
    .attr("stroke-width", (d) => (selectedNodes.has(d.id) ? 2 : 0));

  svg
    .selectAll<SVGLineElement, Link>("line.link")
    .style("stroke", (d) => {
      const sourceRemoved = dataMap.get((d.source as Node).id)?.removed;
      const targetRemoved = dataMap.get((d.target as Node).id)?.removed;

      return sourceRemoved || targetRemoved
        ? "red"
        : selectedNodes.has(getNodeId(d.source)) ||
            selectedNodes.has(getNodeId(d.target))
          ? highlightLinksColor.selected
          : highlightLinksColor.default;
    })
    .attr("stroke-width", (d) =>
      selectedNodes.has(getNodeId(d.source)) ||
      selectedNodes.has(getNodeId(d.target))
        ? 2.5
        : 1.5,
    )
    .attr("stroke-opacity", (d) =>
      selectedNodes.has(getNodeId(d.source)) ||
      selectedNodes.has(getNodeId(d.target))
        ? 0.8
        : 0.6,
    );
};

export default selectionStyling;
