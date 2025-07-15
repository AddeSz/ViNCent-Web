import type { Edge } from "@/types/network";
import type { ScaleBand, Selection } from "d3";
import * as d3 from "d3";

const drawLinks = (
  svgGroup: Selection<SVGGElement, unknown, null, undefined>,
  edges: Edge[],
  x: ScaleBand<string>,
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

  const linkGroup = svgGroup.append("g").attr("class", "link-group");

  edges.forEach((edge) => {
    const sourceId =
      typeof edge.source === "string" ? edge.source : edge.source.id;
    const targetId =
      typeof edge.target === "string" ? edge.target : edge.target.id;

    const isSelected =
      selectedNodes.has(sourceId) || selectedNodes.has(targetId);

    const sourceAngle = angleMap.get(sourceId);
    const targetAngle = angleMap.get(targetId);
    if (sourceAngle === undefined || targetAngle === undefined) return;

    const radius = innerRadius;
    const sx = Math.cos(sourceAngle - Math.PI / 2) * radius;
    const sy = Math.sin(sourceAngle - Math.PI / 2) * radius;
    const tx = Math.cos(targetAngle - Math.PI / 2) * radius;
    const ty = Math.sin(targetAngle - Math.PI / 2) * radius;

    const path = d3.path();
    path.moveTo(sx, sy);
    path.bezierCurveTo(0, 0, 0, 0, tx, ty);

    linkGroup
      .append("path")
      .attr("d", path.toString())
      .attr("fill", "none")
      .attr("stroke", isSelected ? "orange" : "#8884d8")
      .attr("stroke-width", 2)
      .attr("opacity", isSelected ? 1 : 0.6)
      .attr("data-source", sourceId)
      .attr("data-target", targetId);
  });
};

export const updateLinkHighlight = (
  svg: Selection<SVGSVGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
) => {
  svg.selectAll<SVGPathElement, unknown>("g.link-group path").each(function () {
    const path = d3.select(this);

    const sourceId = path.attr("data-source");
    const targetId = path.attr("data-target");

    const isSelected =
      sourceId &&
      targetId &&
      (selectedNodes.has(sourceId) || selectedNodes.has(targetId));

    path
      .attr("stroke", isSelected ? "orange" : "#8884d8")
      .attr("opacity", isSelected ? 1 : 0.6);
  });
};

export default drawLinks;
