import { type LinkRenderingMode } from "@/stores/useChartSettingsStore";
import type { Link } from "@/types/network";
import { getLinkStyle } from "@/utils/ColorHelper";
import {
  ForceEdgeBundling,
  type ForceEdgeBundlingOptions,
  type ForceNode,
} from "@/utils/ForceEdgeBundling";
import { getNodeId } from "@/utils/utils";
import * as d3 from "d3";
import {
  createAngleMap,
  createBezierPath,
  createFdebPaths,
  createHierarchyPath,
} from "./calculateLinks";

const ANIMATION_DURATION = 300;
const OPACITY_VALUE = 0.4;
type LinkData = {
  id: string;
  sourceId: string;
  targetId: string;
  pathData: string;
  isSelected: boolean;
  isRemoved: boolean;
};

const drawLinks = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  links: Link[],
  x: d3.ScaleBand<string>,
  innerRadius: number,
  selectedNodes: Set<string>,
  mode: LinkRenderingMode,
  removedNodeIds: Set<string>,
  fdebSettings: ForceEdgeBundlingOptions,
) => {
  let linkGroup = svg.select<SVGGElement>("g.links-group");
  if (linkGroup.empty()) {
    linkGroup = svg.append("g").attr("class", "links-group");
  }

  const angleMap = createAngleMap(x);
  const fdebPaths =
    mode === "fdeB" ? createFdebPaths(links, x, innerRadius, fdebSettings) : [];

  const linkData: LinkData[] = links
    .map((link, i) => {
      const sourceId = getNodeId(link.source);
      const targetId = getNodeId(link.target);

      const sourceRemoved = removedNodeIds.has(sourceId);
      const targetRemoved = removedNodeIds.has(targetId);
      const isRemoved = sourceRemoved || targetRemoved;
      const isSelected =
        selectedNodes.has(sourceId) || selectedNodes.has(targetId);

      let pathData: string | null = null;
      if (mode === "bezier") {
        pathData = createBezierPath(
          angleMap.get(sourceId)!,
          angleMap.get(targetId)!,
          innerRadius,
        );
      } else if (mode === "hierarchy") {
        pathData = createHierarchyPath(
          angleMap.get(sourceId)!,
          angleMap.get(targetId)!,
          innerRadius,
        );
      } else if (mode === "fdeB") {
        pathData = fdebPaths[i] ?? null;
      }

      if (!pathData) return null;
      return {
        id: `${sourceId}-${targetId}`,
        sourceId,
        targetId,
        pathData,
        isSelected,
        isRemoved,
      };
    })
    .filter((d): d is LinkData => d !== null);

  const paths = linkGroup
    .selectAll<SVGPathElement, LinkData>("path")
    .data(linkData, (d) => d.id);

  paths
    .exit()
    .transition()
    .duration(ANIMATION_DURATION)
    .attr("opacity", 0)
    .remove();

  paths
    .enter()
    .append("path")
    .attr("d", (d) => d.pathData)
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("opacity", 0)
    .attr("data-source", (d) => d.sourceId)
    .attr("data-target", (d) => d.targetId)
    .attr("data-removed", (d) => (d.isRemoved ? "true" : "false"))
    .transition()
    .duration(ANIMATION_DURATION)
    .attr(
      "stroke",
      (d) => getLinkStyle(d.isRemoved, d.isSelected, OPACITY_VALUE).stroke,
    )
    .attr(
      "opacity",
      (d) => getLinkStyle(d.isRemoved, d.isSelected, OPACITY_VALUE).opacity,
    );

  paths
    .transition()
    .duration(ANIMATION_DURATION)
    .attr("d", (d) => d.pathData)
    .attr("data-removed", (d) => (d.isRemoved ? "true" : "false"))
    .attr(
      "stroke",
      (d) => getLinkStyle(d.isRemoved, d.isSelected, OPACITY_VALUE).stroke,
    )
    .attr(
      "opacity",
      (d) => getLinkStyle(d.isRemoved, d.isSelected, OPACITY_VALUE).opacity,
    );
};
export default drawLinks;

export const updateLinkHighlight = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
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

      link
        .attr(
          "stroke",
          getLinkStyle(isRemoved, isSelected, OPACITY_VALUE).stroke,
        )
        .attr(
          "opacity",
          getLinkStyle(isRemoved, isSelected, OPACITY_VALUE).opacity,
        );
    });
};

export const updateFDEBLinks = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  x: d3.ScaleBand<string>,
  innerRadius: number,
  fdebSettings: ForceEdgeBundlingOptions,
) => {
  const linkGroup = svg.select<SVGGElement>("g.links-group");
  if (linkGroup.empty()) return;

  const angleMap = createAngleMap(x);

  const nodes: ForceNode[] = [];
  const edges: { source: string; target: string }[] = [];

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
          if (!nodes.find((n) => n.id === sourceId)) {
            nodes.push({
              id: sourceId,
              x: Math.cos(sourceAngle - Math.PI / 2) * innerRadius,
              y: Math.sin(sourceAngle - Math.PI / 2) * innerRadius,
            });
          }
          if (!nodes.find((n) => n.id === targetId)) {
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
