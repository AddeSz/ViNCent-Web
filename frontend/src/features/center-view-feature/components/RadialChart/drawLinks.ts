import type { Link } from "@/types/network";
import * as d3 from "d3";
import { highlightLinksColor } from "@/utils/ColorHelper";
import { getNodeId } from "@/utils/utils";

const drawLinks = (
  svgGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  links: Link[],
  x: d3.ScaleBand<string>,
  innerRadius: number,
  selectedNodes: Set<string>,
) => {
  const angleMap = new Map<string, number>();
  x.domain().forEach((id) => {
    const angle = x(id);
    if (angle !== undefined) {
      angleMap.set(id, angle + x.bandwidth() / 2);
    }
  });

  const linkGroup = svgGroup.append("g").attr("class", "links-group");

  links.forEach((link) => {
    const sourceId = getNodeId(link.source);
    const targetId = getNodeId(link.target);

    const isSelected =
      selectedNodes.has(sourceId) || selectedNodes.has(targetId);

    const sourceAngle = angleMap.get(sourceId);
    const targetAngle = angleMap.get(targetId);
    if (sourceAngle === undefined || targetAngle === undefined) return;

    const radius = innerRadius;
    const path = d3.path();

    const sx = Math.cos(sourceAngle - Math.PI / 2) * radius;
    const sy = Math.sin(sourceAngle - Math.PI / 2) * radius;
    const tx = Math.cos(targetAngle - Math.PI / 2) * radius;
    const ty = Math.sin(targetAngle - Math.PI / 2) * radius;

    const bendStrength = 0.6;

    const cx1 = sx * bendStrength;
    const cy1 = sy * bendStrength;
    const cx2 = tx * bendStrength;
    const cy2 = ty * bendStrength;

    path.moveTo(sx, sy);
    path.bezierCurveTo(cx1, cy1, cx2, cy2, tx, ty);

    linkGroup
      .append("path")
      .attr("d", path.toString())
      .attr("fill", "none")
      .attr(
        "stroke",
        isSelected ? highlightLinksColor.selected : highlightLinksColor.default,
      )
      .attr("stroke-width", 2)
      .attr("opacity", isSelected ? 1 : 0.6)
      .attr("data-source", sourceId)
      .attr("data-target", targetId);
  });
};

export const updateLinkHighlight = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
) => {
  svg
    .selectAll<SVGPathElement, unknown>("g.links-group path")
    .each(function () {
      const path = d3.select(this);

      const sourceId = path.attr("data-source");
      const targetId = path.attr("data-target");

      const isSelected =
        sourceId &&
        targetId &&
        (selectedNodes.has(sourceId) || selectedNodes.has(targetId));

      path
        .attr(
          "stroke",
          isSelected
            ? highlightLinksColor.selected
            : highlightLinksColor.default,
        )
        .attr("opacity", isSelected ? 1 : 0.6);
    });
};

export default drawLinks;
