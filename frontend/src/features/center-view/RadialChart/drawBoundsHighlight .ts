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
): void => {
  const { groupBounds } = bounds;

  const boundPaths: Array<{ id: string; pathData: string; type: string }> = [];
  const innerArcGen = arc<{
    startAngle: number;
    endAngle: number;
    innerRadius: number;
  }>()
    .innerRadius((d) => d.innerRadius)
    .outerRadius((d) => d.innerRadius)
    .startAngle((d) => d.startAngle)
    .endAngle((d) => d.endAngle);

  const outerArcGen = arc<{
    startAngle: number;
    endAngle: number;
    outerRadius: number;
  }>()
    .innerRadius((d) => d.outerRadius)
    .outerRadius((d) => d.outerRadius)
    .startAngle((d) => d.startAngle)
    .endAngle((d) => d.endAngle);

  if (groupBounds.length > 1) {
    groupBounds.forEach((group) => {
      ["start", "end"].forEach((side) => {
        const angle = side === "start" ? group.startAngle : group.endAngle;
        const x1 = Math.cos(angle - Math.PI / 2) * (innerRadius - 0.5) + 0.3;
        const y1 = Math.sin(angle - Math.PI / 2) * (innerRadius - 0.5) + 0.3;
        const x2 = Math.cos(angle - Math.PI / 2) * (outerRadius + 0.5) + 0.3;
        const y2 = Math.sin(angle - Math.PI / 2) * (outerRadius + 0.5) + 0.3;

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
};

export const updateBoundsHighlight = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  nodeData: Map<string, FullData>,
  selectedNodes: Set<string>,
  hoveredNode: string | null,
) => {
  const linkedToHoveredIds = hoveredNode
    ? nodeData.get(hoveredNode)?.linked
    : null;
  const linkedToSelectedIds = new Set<string>();
  selectedNodes.forEach((nodeId) => {
    const node = nodeData.get(nodeId);
    if (node?.linked && !node?.stable) {
      node.linked.forEach((id) => linkedToSelectedIds.add(id));
    }
  });

  const highlightBounds = cachedBoundsData.groupBounds.filter((bound) => {
    return (
      selectedNodes.has(bound.id) ||
      hoveredNode === bound.id ||
      linkedToHoveredIds?.has(bound.id) ||
      linkedToSelectedIds.has(bound.id)
    );
  });

  const highlightData = highlightBounds.map((bound) => {
    let stroke: string;

    if (selectedNodes.has(bound.id)) {
      stroke = highlightBoundsColor.selected;
    } else if (hoveredNode === bound.id) {
      stroke = highlightBoundsColor.hover;
    } else if (linkedToSelectedIds.has(bound.id)) {
      stroke = highlightBoundsColor.linkedToSelected;
    } else if (linkedToHoveredIds?.has(bound.id)) {
      stroke = highlightBoundsColor.linkedToHovered;
    } else {
      stroke = highlightBoundsColor.hover;
    }

    return {
      ...bound,
      stroke,
      strokeWidth: 1.5,
    };
  });

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
          .call((enter) => enter.attr("opacity", 1)),
      (update) =>
        update
          .attr("d", (d) => d.pathData)
          .attr("stroke", (d) => d.stroke)
          .attr("stroke-width", (d) => d.strokeWidth),
      (exit) => exit.remove(),
    );
};
