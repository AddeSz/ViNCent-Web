import { type LinkRenderingMode } from "@/stores/useChartSettingsStore";
import type { Link } from "@/types/network";
import { highlightLinksColor } from "@/utils/ColorHelper";
import {
  ForceEdgeBundling,
  type ForceEdgeBundlingOptions,
  type Node,
} from "@/utils/ForceEdgeBundling";
import { getNodeId } from "@/utils/utils";
import * as d3 from "d3";

const ANIMATION_DURATION = 300;

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
  const angleMap = new Map<string, number>();
  x.domain().forEach((id) => {
    const angle = x(id);
    if (angle !== undefined) angleMap.set(id, angle + x.bandwidth() / 2);
  });
  let linkGroup = svg.select<SVGGElement>("g.links-group");
  if (linkGroup.empty()) {
    linkGroup = svg.append("g").attr("class", "links-group");
  }
  let fdebPaths: (string | null)[] = [];

  if (mode === "fdeB") {
    const nodes: Node[] = x.domain().map((id) => {
      const angle = (x(id) ?? 0) + x.bandwidth() / 2;
      return {
        id,
        x: Math.cos(angle - Math.PI / 2) * innerRadius,
        y: Math.sin(angle - Math.PI / 2) * innerRadius,
      };
    });

    const nodeIds = new Set(nodes.map((n) => n.id));

    const validEdges = links
      .map((l, i) => {
        const source = getNodeId(l.source);
        const target = getNodeId(l.target);
        return { index: i, source, target };
      })
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));

    const edgesForBundling = validEdges.map((e) => ({
      source: e.source,
      target: e.target,
    }));

    if (edgesForBundling.length > 0) {
      const fdeb = new ForceEdgeBundling(fdebSettings)
        .setNodes(nodes)
        .setEdges(edgesForBundling);

      const bundled = fdeb.bundle();

      const line = d3
        .line<{ x: number; y: number }>()
        .x((d) => d.x)
        .y((d) => d.y)
        .curve(d3.curveBundle.beta(0.85));

      fdebPaths = new Array(links.length).fill(null);

      bundled.forEach((b, j) => {
        const originalIndex = validEdges[j].index;
        fdebPaths[originalIndex] = line(b) ?? null;
      });
    }
  }

  const linkData = links
    .map((link, i) => {
      const sourceId = getNodeId(link.source);
      const targetId = getNodeId(link.target);

      const sourceRemoved = removedNodeIds.has(sourceId);
      const targetRemoved = removedNodeIds.has(targetId);
      const isRemoved = sourceRemoved || targetRemoved;
      // if (isRemoved) return null;
      let pathData: string | null = null;

      if (mode === "bezier") {
        const sourceAngle = angleMap.get(sourceId);
        const targetAngle = angleMap.get(targetId);
        if (sourceAngle === undefined || targetAngle === undefined) return null;

        const r = innerRadius;
        const sx = Math.cos(sourceAngle - Math.PI / 2) * r;
        const sy = Math.sin(sourceAngle - Math.PI / 2) * r;
        const tx = Math.cos(targetAngle - Math.PI / 2) * r;
        const ty = Math.sin(targetAngle - Math.PI / 2) * r;

        const bend = 0.6;
        const cx1 = sx * bend;
        const cy1 = sy * bend;
        const cx2 = tx * bend;
        const cy2 = ty * bend;

        const path = d3.path();
        path.moveTo(sx, sy);
        path.bezierCurveTo(cx1, cy1, cx2, cy2, tx, ty);
        pathData = path.toString();
      } else if (mode === "hierarchy") {
        const sourceAngle = angleMap.get(sourceId);
        const targetAngle = angleMap.get(targetId);
        if (sourceAngle === undefined || targetAngle === undefined) return null;

        const points = [
          { x: sourceAngle, y: innerRadius },
          { x: (sourceAngle + targetAngle) / 2, y: innerRadius * 0.3 },
          { x: targetAngle, y: innerRadius },
        ];

        const line = d3
          .lineRadial<{ x: number; y: number }>()
          .curve(d3.curveBundle.beta(1))
          .radius((d) => d.y)
          .angle((d) => d.x);

        pathData = line(points) ?? null;
      } else if (mode === "fdeB" && fdebPaths) {
        pathData = fdebPaths[i] ?? null;
      }

      if (!pathData) return null;

      const isSelected =
        selectedNodes.has(sourceId) || selectedNodes.has(targetId);

      return {
        id: `${sourceId}-${targetId}`,
        sourceId,
        targetId,
        pathData,
        isSelected,
        isRemoved,
      };
    })
    .filter(Boolean) as {
    id: string;
    sourceId: string;
    targetId: string;
    pathData: string;
    isSelected: boolean;
    isRemoved: boolean;
  }[];

  const paths = linkGroup
    .selectAll<SVGPathElement, (typeof linkData)[0]>("path")
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
    .attr("stroke", (d) =>
      d.isRemoved
        ? "red"
        : d.isSelected
          ? highlightLinksColor.selected
          : highlightLinksColor.default,
    )
    .attr("stroke-width", 1.5)
    .attr("opacity", 0)
    .attr("data-source", (d) => d.sourceId)
    .attr("data-target", (d) => d.targetId)
    .attr("data-removed", (d) => (d.isRemoved ? "true" : "false"))
    .transition()
    .duration(ANIMATION_DURATION)
    .attr("opacity", (d) => (d.isRemoved ? 0.2 : d.isSelected ? 1 : 0.4));

  paths
    .transition()
    .duration(ANIMATION_DURATION)
    .attr("d", (d) => d.pathData)
    .attr("stroke", (d) =>
      d.isRemoved
        ? "red"
        : d.isSelected
          ? highlightLinksColor.selected
          : highlightLinksColor.default,
    )
    .attr("data-removed", (d) => (d.isRemoved ? "true" : "false"))
    .attr("opacity", (d) => (d.isRemoved ? 0.2 : d.isSelected ? 1 : 0.4));
};

export const updateLinkHighlight = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
) => {
  svg
    .selectAll<SVGPathElement, unknown>("g.links-group path")
    .each(function () {
      const path = d3.select(this);

      const isRemoved = path.attr("data-removed") === "true";
      const sourceId = path.attr("data-source");
      const targetId = path.attr("data-target");

      const isSelected =
        sourceId &&
        targetId &&
        (selectedNodes.has(sourceId) || selectedNodes.has(targetId));

      path
        .attr(
          "stroke",
          isRemoved
            ? "red"
            : isSelected
              ? highlightLinksColor.selected
              : highlightLinksColor.default,
        )
        .attr("opacity", isRemoved ? 0.2 : isSelected ? 1 : 0.4);
    });
};

export const updateDrawLinks = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  x: d3.ScaleBand<string>,
  innerRadius: number,
  fdebSettings: ForceEdgeBundlingOptions,
) => {
  const linkGroup = svg.select<SVGGElement>("g.links-group");
  if (linkGroup.empty()) return;

  const angleMap = new Map<string, number>();
  x.domain().forEach((id) => {
    const angle = x(id);
    if (angle !== undefined) angleMap.set(id, angle + x.bandwidth() / 2);
  });

  const nodes: Node[] = [];
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

export default drawLinks;
