import { type GetColorForMetric } from "@/hooks/useGetColorForMetric";
import type { FullData } from "@/types";
import * as d3 from "d3";
import type { BoundsResult } from "./utils/calculateBounds";

interface BoundsStyle {
  color: string;
  width: number;
}

interface HighlightBound {
  id: string;
  startAngle: number;
  endAngle: number;
  type: "radial" | "segment";
  stroke: string;
  strokeWidth: number;
  radius?: number;
  innerRadius?: number;
  outerRadius?: number;
}

interface BoundsCanvasCache {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  bounds: BoundsResult;
  innerRadius: number;
  outerRadius: number;
  center: number;
  canvasSize: number;
  zoomFactor: number;
  highlightBounds: HighlightBound[];
}

const highlightBoundsColor = {
  selected: "#FFA500",
  hover: "#bfdbfe",
  linkedToSelected: "#FF4500 ",
  linkedToHovered: "#3b82f6",
};

let boundsCache: BoundsCanvasCache | null = null;

export function drawBoundsCanvas(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  bounds: BoundsResult,
  innerRadius: number,
  outerRadius: number,
  changeCircleRadius: number,
  zoomFactor: number,
): void {
  const requiredRadius = outerRadius + 40 + changeCircleRadius;
  const canvasSize = Math.ceil(requiredRadius * 2);
  const center = Math.floor(canvasSize / 2);
  const canvas = getOrCreateBoundsCanvas(svg, canvasSize, center, zoomFactor);
  const ctx = canvas.node()?.getContext("2d");

  if (!ctx) return;
  boundsCache = {
    canvas: canvas.node()!,
    ctx,
    bounds,
    innerRadius,
    outerRadius,
    center,
    canvasSize,
    zoomFactor,
    highlightBounds: [],
  };

  drawBoundsOnCanvas(
    ctx,
    bounds,
    innerRadius,
    outerRadius,
    center,
    zoomFactor,
    {
      color: "black",
      width: 1,
    },
    [],
  );
}

export function updateBoundsHighlight(
  nodeData: Map<string, FullData>,
  selectedNodes: Set<string>,
  hoveredNode: string | null,
  hoveredCommunity: { key: string; id: number } | null,
  getColorForMetric: GetColorForMetric,
): void {
  if (!boundsCache) return;

  const {
    bounds,
    ctx,
    innerRadius,
    outerRadius,
    center,
    zoomFactor: currentPixelRatio,
  } = boundsCache;

  const linkedToHoveredIds = hoveredNode
    ? nodeData.get(hoveredNode)?.linked
    : null;

  const linkedToSelectedIds = new Set<string>();
  selectedNodes.forEach((nodeId) => {
    const node = nodeData.get(nodeId);
    if (node?.linked && !node?.removed) {
      node.linked.forEach((id) => linkedToSelectedIds.add(id));
    }
  });

  const nodesToHighlight = new Set<string>();
  selectedNodes.forEach((id) => nodesToHighlight.add(id));
  if (hoveredNode) nodesToHighlight.add(hoveredNode);
  linkedToSelectedIds.forEach((id) => nodesToHighlight.add(id));
  if (linkedToHoveredIds) {
    linkedToHoveredIds.forEach((id) => nodesToHighlight.add(id));
  }

  let minRadius = Infinity;
  let maxRadius = -Infinity;
  for (const { inner, outer } of bounds.layerBounds) {
    minRadius = Math.min(minRadius, inner);
    maxRadius = Math.max(maxRadius, outer);
  }

  const highlightBounds: HighlightBound[] = [];

  bounds.groupBounds.forEach((bound) => {
    let shouldHighlight = false;
    let stroke: string;

    if (hoveredCommunity) {
      const node = nodeData.get(bound.id);
      const communityId = node?.[hoveredCommunity.key];
      if (communityId === hoveredCommunity.id) {
        shouldHighlight = true;
        stroke = getColorForMetric(hoveredCommunity.key, communityId);
      }
    }

    if (!shouldHighlight) {
      shouldHighlight =
        selectedNodes.has(bound.id) ||
        hoveredNode === bound.id ||
        linkedToHoveredIds?.has(bound.id) ||
        linkedToSelectedIds.has(bound.id);

      if (!shouldHighlight) return;

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
    }

    highlightBounds.push({
      id: bound.id,
      startAngle: bound.startAngle,
      endAngle: bound.endAngle,
      type: "radial",
      stroke: stroke!,
      strokeWidth: 1.5,
    });

    highlightBounds.push({
      id: `${bound.id}-inner`,
      startAngle: bound.startAngle,
      endAngle: bound.endAngle,
      type: "segment",
      stroke: stroke!,
      strokeWidth: 1.5,
      radius: minRadius,
    });

    highlightBounds.push({
      id: `${bound.id}-outer`,
      startAngle: bound.startAngle,
      endAngle: bound.endAngle,
      type: "segment",
      stroke: stroke!,
      strokeWidth: 1.5,
      radius: maxRadius,
    });
  });

  boundsCache.highlightBounds = highlightBounds;

  drawBoundsOnCanvas(
    ctx,
    bounds,
    innerRadius,
    outerRadius,
    center,
    currentPixelRatio,
    {
      color: "black",
      width: 1,
    },
    highlightBounds,
  );
}
export function redrawBoundsOnZoom(zoomFactor: number): void {
  if (!boundsCache) return;

  const {
    canvas,
    bounds,
    innerRadius,
    outerRadius,
    center,
    canvasSize,
    highlightBounds,
  } = boundsCache;

  const bufferSize = Math.floor(canvasSize * zoomFactor);

  canvas.width = bufferSize;
  canvas.height = bufferSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  boundsCache.ctx = ctx;
  boundsCache.zoomFactor = zoomFactor;

  drawBoundsOnCanvas(
    ctx,
    bounds,
    innerRadius,
    outerRadius,
    center,
    zoomFactor,
    {
      color: "black",
      width: 1,
    },
    highlightBounds,
  );
}

function drawBoundsOnCanvas(
  ctx: CanvasRenderingContext2D,
  bounds: BoundsResult,
  innerRadius: number,
  outerRadius: number,
  center: number,
  zoomFactor: number,
  baseStyle: BoundsStyle,
  highlightBounds: HighlightBound[],
): void {
  const { groupBounds, layerBounds } = bounds;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.save();
  ctx.scale(zoomFactor, zoomFactor);
  ctx.translate(center, center);
  ctx.rotate(-Math.PI / 2);

  ctx.strokeStyle = baseStyle.color;
  ctx.lineWidth = baseStyle.width;
  ctx.globalAlpha = 1;

  const radiiSet = new Set<number>();
  for (const { inner, outer } of layerBounds) {
    radiiSet.add(inner);
    radiiSet.add(outer);
  }

  for (const radius of radiiSet) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (groupBounds.length > 1) {
    groupBounds.forEach((group) => {
      [group.startAngle, group.endAngle].forEach((angle) => {
        ctx.beginPath();
        ctx.moveTo(
          Math.cos(angle) * innerRadius,
          Math.sin(angle) * innerRadius,
        );
        ctx.lineTo(
          Math.cos(angle) * outerRadius,
          Math.sin(angle) * outerRadius,
        );
        ctx.stroke();
      });
    });
  }

  if (highlightBounds.length > 0) {
    ctx.globalAlpha = 1;

    for (const highlight of highlightBounds) {
      ctx.strokeStyle = highlight.stroke;
      ctx.lineWidth = highlight.strokeWidth;

      if (highlight.type === "radial") {
        [highlight.startAngle, highlight.endAngle].forEach((angle) => {
          ctx.beginPath();
          ctx.moveTo(
            Math.cos(angle) * (innerRadius - 0.5),
            Math.sin(angle) * (innerRadius - 0.5),
          );
          ctx.lineTo(
            Math.cos(angle) * (outerRadius + 0.5),
            Math.sin(angle) * (outerRadius + 0.5),
          );
          ctx.stroke();
        });
      } else if (highlight.type === "segment" && highlight.radius) {
        ctx.beginPath();
        ctx.arc(
          0,
          0,
          highlight.radius,
          highlight.startAngle,
          highlight.endAngle,
          false,
        );
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

function getOrCreateBoundsCanvas(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  canvasSize: number,
  center: number,
  zoomFactor: number,
): d3.Selection<HTMLCanvasElement, unknown, null, undefined> {
  let foreignObject = g.select<SVGForeignObjectElement>(
    "foreignObject.bounds-canvas-container",
  );

  if (foreignObject.empty()) {
    foreignObject = g
      .append("foreignObject")
      .attr("class", "bounds-canvas-container")
      .attr("x", -center)
      .attr("y", -center)
      .attr("width", canvasSize)
      .attr("height", canvasSize)
      .style("pointer-events", "none");
  } else {
    foreignObject
      .attr("x", -center)
      .attr("y", -center)
      .attr("width", canvasSize)
      .attr("height", canvasSize);
  }

  let canvas = foreignObject.select<HTMLCanvasElement>("canvas");
  const bufferSize = Math.floor(canvasSize * zoomFactor);

  if (canvas.empty()) {
    canvas = foreignObject
      .append("xhtml:canvas")
      .attr("class", "bounds-canvas")
      .attr("width", bufferSize)
      .attr("height", bufferSize)
      .style("width", `${canvasSize}px`)
      .style("height", `${canvasSize}px`)
      .style("pointer-events", "none") as unknown as d3.Selection<
      HTMLCanvasElement,
      unknown,
      null,
      undefined
    >;
  } else {
    canvas
      .attr("width", bufferSize)
      .attr("height", bufferSize)
      .style("width", `${canvasSize}px`)
      .style("height", `${canvasSize}px`);
  }

  return canvas as d3.Selection<HTMLCanvasElement, unknown, null, undefined>;
}
