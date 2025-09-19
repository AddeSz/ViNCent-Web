import { highlightBoundsColor } from "@/utils/ColorHelper";
import { arc } from "d3-shape";
import type { BoundsResult } from "./calculateBounds";

const sideLinePath = (angle: number, inner: number, outer: number): string => {
  const x1 = Math.cos(angle - Math.PI / 2) * inner;
  const y1 = Math.sin(angle - Math.PI / 2) * inner;
  const x2 = Math.cos(angle - Math.PI / 2) * outer;
  const y2 = Math.sin(angle - Math.PI / 2) * outer;
  return `M${x1},${y1}L${x2},${y2}`;
};

const drawBounds = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  bounds: BoundsResult,
  innerRadius: number,
  outerRadius: number,
  selectedNodes: Set<string>,
): void => {
  const { groupBounds, layerBounds } = bounds;
  const boundsSVG = svg
    .append("g")
    .attr("class", "bounds-group")
    .attr("stroke-width", 1)
    .attr("pointer-events", "none");

  boundsSVG
    .selectAll("circle.layer-bounds")
    .data(layerBounds)
    .join("circle")
    .attr("class", "layer-bounds")
    .attr("r", (d) => d.outer)
    .attr("stroke", highlightBoundsColor.default)
    .attr("fill", "none");

  if (groupBounds.length > 1) {
    boundsSVG
      .selectAll("path.side-bounds")
      .data(
        groupBounds.flatMap((d) => [
          {
            id: d.id,
            angle: d.startAngle,
            inner: innerRadius,
            outer: outerRadius,
          },
          {
            id: d.id,
            angle: d.endAngle,
            inner: innerRadius,
            outer: outerRadius,
          },
        ]),
      )
      .join("path")
      .attr("class", "boundary-line side-bounds")
      .attr("data-id", (d) => d.id)
      .attr("d", (d) => sideLinePath(d.angle, innerRadius, outerRadius));
  }

  const innerArcGen = arc<{
    startAngle: number;
    endAngle: number;
    innerRadius: number;
  }>()
    .innerRadius((d) => d.innerRadius + 0.6)
    .outerRadius((d) => d.innerRadius + 0.5)
    .startAngle((d) => d.startAngle)
    .endAngle((d) => d.endAngle);

  boundsSVG
    .append("circle")
    .attr("r", innerRadius)
    .attr("stroke", highlightBoundsColor.default)
    .attr("fill", "none");

  boundsSVG
    .selectAll("path.inner-bounds")
    .data(groupBounds)
    .join("path")
    .attr("class", "boundary-line inner-bounds")
    .attr("data-id", (d) => d.id)
    .attr("fill", "none")
    .attr("d", (d) => innerArcGen({ ...d, innerRadius: innerRadius })!);

  const outerArcGen = arc<{
    startAngle: number;
    endAngle: number;
    outerRadius: number;
  }>()
    .innerRadius((d) => d.outerRadius - 0.1)
    .outerRadius((d) => d.outerRadius)
    .startAngle((d) => d.startAngle)
    .endAngle((d) => d.endAngle);

  boundsSVG
    .selectAll("path.outer-bounds")
    .data(groupBounds)
    .join("path")
    .attr("class", "boundary-line outer-bounds")
    .attr("data-id", (d) => d.id)
    .attr("fill", "none")
    .attr("d", (d) => outerArcGen({ ...d, outerRadius: outerRadius })!);

  updateBoundHighlight(boundsSVG, selectedNodes);
};

export const updateBoundHighlight = <T extends SVGElement>(
  svg: d3.Selection<T, unknown, null, undefined>,
  selectedNodes: Set<string>,
) => {
  svg
    .selectAll<SVGPathElement, { id: string }>("path.boundary-line")
    .attr("stroke", (d) =>
      selectedNodes.has(d.id)
        ? highlightBoundsColor.selected
        : highlightBoundsColor.default,
    )
    .attr("stroke-width", (d) => (selectedNodes.has(d.id) ? 2 : 1));
};

export default drawBounds;
