import * as d3 from "d3";
import type { Node, Edge } from "@/types/network";
import { highlightLinksColor } from "@/utils/ColorHelper";

export const selectionStyling = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
) => {
  svg
    .selectAll<SVGCircleElement, Node>("circle.node")
    .attr("stroke", (d) =>
      selectedNodes.has(d.id) ? highlightLinksColor.selected : "none",
    )
    .attr("stroke-width", (d) => (selectedNodes.has(d.id) ? 2 : 0));

  const getNodeId = (node: string | Node): string =>
    typeof node === "string" ? node : node.id;

  svg
    .selectAll<SVGLineElement, Edge>("line.link")
    .attr("stroke", (d) =>
      selectedNodes.has(getNodeId(d.source)) ||
      selectedNodes.has(getNodeId(d.target))
        ? highlightLinksColor.selected
        : highlightLinksColor.default,
    )
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
