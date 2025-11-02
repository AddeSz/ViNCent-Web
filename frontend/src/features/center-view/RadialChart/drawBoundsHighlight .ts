import type { FullData } from "@/types/network";
import { highlightBoundsColor } from "@/utils/ColorHelper";
import { arc } from "d3";
import type { BoundsResult } from "./utils/calculateBounds";

let cachedBoundsData: {
  groupBounds: Array<{ id: string; pathData: string; type: string }>;
} = { groupBounds: [] };

export const drawBoundsHighlight = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  bounds: BoundsResult,
  innerRadius: number,
  outerRadius: number,
  selectedNodes: Set<string>,
  hoveredNode: FullData | null,
): void => {
  const { groupBounds } = bounds;

  const boundPaths: Array<{ id: string; pathData: string; type: string }> = [];
  const innerArcGen = arc<{
    startAngle: number;
    endAngle: number;
    innerRadius: number;
  }>()
    .innerRadius((d) => d.innerRadius + 0.4)
    .outerRadius((d) => d.innerRadius + 0.5)
    .startAngle((d) => d.startAngle)
    .endAngle((d) => d.endAngle);

  const outerArcGen = arc<{
    startAngle: number;
    endAngle: number;
    outerRadius: number;
  }>()
    .innerRadius((d) => d.outerRadius - 0.1)
    .outerRadius((d) => d.outerRadius)
    .startAngle((d) => d.startAngle)
    .endAngle((d) => d.endAngle);

  if (groupBounds.length > 1) {
    groupBounds.forEach((group) => {
      ["start", "end"].forEach((side) => {
        const angle = side === "start" ? group.startAngle : group.endAngle;
        const x1 = Math.cos(angle - Math.PI / 2) * innerRadius;
        const y1 = Math.sin(angle - Math.PI / 2) * innerRadius;
        const x2 = Math.cos(angle - Math.PI / 2) * outerRadius;
        const y2 = Math.sin(angle - Math.PI / 2) * outerRadius;

        boundPaths.push({
          id: group.id,
          pathData: `M${x1},${y1}L${x2},${y2}`,
          type: `side-${side}`,
        });
      });

      boundPaths.push({
        id: group.id,
        pathData: innerArcGen({
          startAngle: group.startAngle,
          endAngle: group.endAngle,
          innerRadius: innerRadius,
        })!,
        type: "inner-arc",
      });

      boundPaths.push({
        id: group.id,
        pathData: outerArcGen({
          startAngle: group.startAngle,
          endAngle: group.endAngle,
          outerRadius: outerRadius,
        })!,
        type: "outer-arc",
      });
    });
  }

  cachedBoundsData = { groupBounds: boundPaths };

  let highlightGroup = svg.select<SVGGElement>("g.bounds-highlight");
  if (highlightGroup.empty()) {
    highlightGroup = svg
      .append("g")
      .attr("class", "bounds-highlight")
      .style("pointer-events", "none");
  }

  updateBoundsHighlight(svg, selectedNodes, hoveredNode);
};

export const updateBoundsHighlight = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
  hoveredNode: FullData | null,
) => {
  const highlightBounds = cachedBoundsData.groupBounds.filter((bound) => {
    return selectedNodes.has(bound.id) || hoveredNode?.id === bound.id;
  });

  const highlightData = highlightBounds.map((bound) => ({
    ...bound,
    stroke: selectedNodes.has(bound.id)
      ? highlightBoundsColor.selected
      : highlightBoundsColor.hover,
    strokeWidth: selectedNodes.has(bound.id) ? 1.5 : 1.5,
  }));

  svg
    .select("g.bounds-highlight")
    .selectAll<SVGPathElement, (typeof highlightData)[0]>("path")
    .data(highlightData, (d) => `${d.id}-${d.type}`)
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("d", (d) => d.pathData)
          .attr("fill", "none")
          .attr("stroke", (d) => d.stroke)
          .attr("stroke-width", (d) => d.strokeWidth)
          .attr("opacity", 0)
          .call((enter) => enter.attr("opacity", 0.9)),
      (update) =>
        update
          .attr("d", (d) => d.pathData)
          .attr("stroke", (d) => d.stroke)
          .attr("stroke-width", (d) => d.strokeWidth),
      (exit) => exit.remove(),
    );
};
