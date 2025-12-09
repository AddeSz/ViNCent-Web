import { type EdgeRenderingMode } from "@/stores/useSettingsStore";
import type { Edge, FullData } from "@/types/network";
import { getLinkStyle } from "@/utils/ColorHelper";
import {
  ForceEdgeBundling,
  type ForceEdgeBundlingOptions,
  type ForceNode,
} from "@/utils/ForceEdgeBundling";
import { getNodeId } from "@/utils/utils";
import * as d3 from "d3";
import {
  createBezierPath,
  createFdebPaths,
  createHierarchyPath,
} from "../utils/calculateLinks";

const ANIMATION_DURATION = 300;

type LinkData = {
  id: string;
  sourceId: string;
  targetId: string;
  pathData: string;
  isSelected: boolean;
  isRemoved: boolean;
  stroke: string;
  opacity: number;
};

const calculateStyles = (
  isRemoved: boolean,
  isSelected: boolean,
  isHovered: boolean,
): { stroke: string; opacity: number } => {
  return getLinkStyle(isRemoved, isSelected, isHovered, 0.4, 0.9);
};

const drawLinks = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  links: Edge[],
  x: d3.ScaleBand<string>,
  innerRadius: number,
  selectedNodes: Set<string>,
  mode: EdgeRenderingMode,
  removedNodeIds: Set<string>,
  fdebSettings: ForceEdgeBundlingOptions,
  angleMap: Map<string, number>,
  hoveredNode: FullData | null,
) => {
  let linkGroup = svg.select<SVGGElement>("g.links-group");
  if (linkGroup.empty()) {
    linkGroup = svg
      .append("g")
      .attr("class", "links-group")
      .style("will-change", "opacity, stroke");
  }

  const fdebPaths =
    mode === "fdeB" ? createFdebPaths(links, x, innerRadius, fdebSettings) : [];

  const linkData: LinkData[] = [];
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const sourceId = getNodeId(link.source);
    const targetId = getNodeId(link.target);

    const sourceRemoved = removedNodeIds.has(sourceId);
    const targetRemoved = removedNodeIds.has(targetId);
    const isRemoved = sourceRemoved || targetRemoved;
    const isSelected =
      selectedNodes.has(sourceId) || selectedNodes.has(targetId);
    const isHovered = !!(
      hoveredNode &&
      sourceId &&
      targetId &&
      (sourceId === hoveredNode.id || targetId === hoveredNode.id)
    );
    let pathData: string | null = null;

    if (mode === "bezier") {
      const sourceAngle = angleMap.get(sourceId);
      const targetAngle = angleMap.get(targetId);
      if (sourceAngle !== undefined && targetAngle !== undefined) {
        pathData = createBezierPath(sourceAngle, targetAngle, innerRadius);
      }
    } else if (mode === "hierarchy") {
      const sourceAngle = angleMap.get(sourceId);
      const targetAngle = angleMap.get(targetId);
      if (sourceAngle !== undefined && targetAngle !== undefined) {
        pathData = createHierarchyPath(sourceAngle, targetAngle, innerRadius);
      }
    } else if (mode === "fdeB") {
      pathData = fdebPaths[i] ?? null;
    }

    if (!pathData) continue;

    const style = calculateStyles(isRemoved, isSelected, isHovered);

    linkData.push({
      id: `${sourceId}-${targetId}`,
      sourceId,
      targetId,
      pathData,
      isSelected,
      isRemoved,
      stroke: style.stroke,
      opacity: style.opacity,
    });
  }

  linkGroup
    .selectAll<SVGPathElement, LinkData>("path")
    .data(linkData, (d) => d.id)
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("d", (d) => d.pathData)
          .attr("fill", "none")
          .attr("stroke", (d) => d.stroke ?? "#999")
          .attr("stroke-width", 1.5)
          .attr("opacity", 0)
          .attr("data-source", (d) => d.sourceId)
          .attr("data-target", (d) => d.targetId)
          .attr("data-removed", (d) => (d.isRemoved ? "true" : "false"))
          .call((enter) =>
            enter
              .transition()
              .duration(ANIMATION_DURATION)
              .attr("stroke", (d) => d.stroke)
              .attr("opacity", (d) => d.opacity),
          ),
      (update) =>
        update.call((update) =>
          update
            .transition()
            .duration(ANIMATION_DURATION)
            .attr("stroke", (d) => d.stroke)
            .attr("d", (d) => d.pathData)
            .attr("data-removed", (d) => (d.isRemoved ? "true" : "false"))
            .attr("opacity", (d) => d.opacity),
        ),
      (exit) =>
        exit.call((exit) =>
          exit
            .transition()
            .duration(ANIMATION_DURATION)
            .attr("opacity", 0)
            .remove(),
        ),
    );
};

export default drawLinks;

export const updateLinkHighlight = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
  hoveredNode: FullData | null,
) => {
  svg
    .selectAll<SVGPathElement, unknown>("g.links-group path")
    .each(function () {
      const link = d3.select(this);

      const isRemoved = link.attr("data-removed") === "true";
      const sourceId = link.attr("data-source");
      const targetId = link.attr("data-target");

      const isSelected = !!(
        sourceId &&
        targetId &&
        (selectedNodes.has(sourceId) || selectedNodes.has(targetId))
      );

      const isHovered = !!(
        hoveredNode &&
        sourceId &&
        targetId &&
        (sourceId === hoveredNode.id || targetId === hoveredNode.id)
      );

      const style = calculateStyles(isRemoved, isSelected, isHovered);

      link.attr("stroke", style.stroke).attr("opacity", style.opacity);
      if (isHovered || isSelected) {
        link.raise();
      }
    });
};

export const updateFDEBLinks = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  innerRadius: number,
  fdebSettings: ForceEdgeBundlingOptions,
  angleMap: Map<string, number>,
) => {
  const linkGroup = svg.select<SVGGElement>("g.links-group");
  if (linkGroup.empty()) return;

  const nodes: ForceNode[] = [];
  const edges: { source: string; target: string }[] = [];
  const nodeSet = new Set<string>();

  svg
    .selectAll<SVGPathElement, unknown>("g.links-group path")
    .each(function () {
      const path = d3.select(this);
      const sourceId = path.attr("data-source");
      const targetId = path.attr("data-target");

      if (sourceId && targetId) {
        const sourceAngle = angleMap.get(sourceId);
        const targetAngle = angleMap.get(targetId);

        if (sourceAngle !== undefined && targetAngle !== undefined) {
          if (!nodeSet.has(sourceId)) {
            nodeSet.add(sourceId);
            nodes.push({
              id: sourceId,
              x: Math.cos(sourceAngle - Math.PI / 2) * innerRadius,
              y: Math.sin(sourceAngle - Math.PI / 2) * innerRadius,
            });
          }
          if (!nodeSet.has(targetId)) {
            nodeSet.add(targetId);
            nodes.push({
              id: targetId,
              x: Math.cos(targetAngle - Math.PI / 2) * innerRadius,
              y: Math.sin(targetAngle - Math.PI / 2) * innerRadius,
            });
          }
          edges.push({ source: sourceId, target: targetId });
        }
      }
    });

  if (edges.length > 0) {
    const fdeb = new ForceEdgeBundling(fdebSettings)
      .setNodes(nodes)
      .setEdges(edges);
    const bundled = fdeb.bundle();
    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => d.x)
      .y((d) => d.y)
      .curve(d3.curveBundle.beta(0.85));

    svg
      .selectAll<SVGPathElement, unknown>("g.links-group path")
      .each(function (_, i) {
        if (i < bundled.length) {
          d3.select(this)
            .transition()
            .duration(ANIMATION_DURATION)
            .attr("d", line(bundled[i]) ?? "");
        }
      });
  }
};
