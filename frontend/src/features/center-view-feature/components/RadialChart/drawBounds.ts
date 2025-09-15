import { arc } from "d3-shape";
import type { GroupBound } from "./calculateBounds";
import { highlightBoundsColor } from "@/utils/ColorHelper";

const sideLinePath = (angle: number, inner: number, outer: number): string => {
  const x1 = Math.cos(angle - Math.PI / 2) * inner;
  const y1 = Math.sin(angle - Math.PI / 2) * inner;
  const x2 = Math.cos(angle - Math.PI / 2) * outer;
  const y2 = Math.sin(angle - Math.PI / 2) * outer;
  return `M${x1},${y1}L${x2},${y2}`;
};

const drawBounds = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  groupBounds: GroupBound[],
  innerRadius: number,
  outerRadius: number,
  selectedNodes: Set<string>,
): void => {
  const boundsSVG = svg
    .append("g")
    .attr("class", "bounds-group")
    .attr("stroke-width", 2)
    .attr("pointer-events", "none");

  if (groupBounds.length > 1) {
    boundsSVG
      .selectAll("path.side-bounds")
      .data(
        groupBounds.flatMap((d) => [
          { id: d.id, angle: d.startAngle, inner: d.inner, outer: d.outer },
          { id: d.id, angle: d.endAngle, inner: d.inner, outer: d.outer },
        ]),
      )
      .join("path")
      .attr("class", "boundary-line side-bounds")
      .attr("data-id", (d) => d.id)
      .attr("stroke", (d) =>
        selectedNodes.has(d.id)
          ? highlightBoundsColor.selected
          : highlightBoundsColor.default,
      )
      .attr("d", (d) => sideLinePath(d.angle, d.inner, outerRadius));
  }
  const innerArcGen = arc<{
    startAngle: number;
    endAngle: number;
    innerRadius: number;
  }>()
    .innerRadius((d) => d.innerRadius)
    .outerRadius((d) => d.innerRadius + 1)
    .startAngle((d) => d.startAngle)
    .endAngle((d) => d.endAngle);

  boundsSVG
    .append("circle")
    .attr("r", innerRadius)
    .attr("stroke", "black")
    .attr("fill", "none");

  boundsSVG
    .selectAll("path.inner-bounds")
    .data(groupBounds)
    .join("path")
    .attr("class", "boundary-line inner-bounds")
    .attr("data-id", (d) => d.id)
    .attr("fill", "none")
    .attr("stroke", (d) =>
      selectedNodes.has(d.id)
        ? highlightBoundsColor.selected
        : highlightBoundsColor.default,
    )
    .attr("d", (d) => innerArcGen({ ...d, innerRadius: d.inner })!);

  const outerArcGen = arc<{
    startAngle: number;
    endAngle: number;
    outerRadius: number;
  }>()
    .innerRadius((d) => d.outerRadius - 1)
    .outerRadius((d) => d.outerRadius)
    .startAngle((d) => d.startAngle)
    .endAngle((d) => d.endAngle);

  boundsSVG
    .append("circle")
    .attr("r", outerRadius)
    .attr("stroke", "black")
    .attr("fill", "none");

  boundsSVG
    .selectAll("path.outer-bounds")
    .data(groupBounds)
    .join("path")
    .attr("class", "boundary-line outer-bounds")
    .attr("data-id", (d) => d.id)
    .attr("fill", "none")
    .attr("stroke", (d) =>
      selectedNodes.has(d.id)
        ? highlightBoundsColor.selected
        : highlightBoundsColor.default,
    )
    .attr("d", (d) => outerArcGen({ ...d, outerRadius: outerRadius })!);
};

export const updateBoundHighlight = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
) => {
  svg
    .selectAll<SVGPathElement, { id: string }>("path.boundary-line")
    .attr("stroke", (d) =>
      selectedNodes.has(d.id)
        ? highlightBoundsColor.selected
        : highlightBoundsColor.default,
    );
};

export default drawBounds;
