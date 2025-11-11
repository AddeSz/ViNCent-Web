import { type LinkRenderingMode } from "@/stores/useSettingsStore";
import type { DataChanges, FullData } from "@/types/network";
import { getLinkStyle } from "@/utils/ColorHelper";
import { type ForceEdgeBundlingOptions } from "@/utils/ForceEdgeBundling";
import * as d3 from "d3";
import {
  getClosestZoomLevel,
  ZOOM_LEVELS,
  type ZoomLevel,
} from "../hooks/useZoom";
import {
  createBezierPath,
  createFdebPathsWorker,
  createHierarchyPath,
} from "./utils/calculateLinks";

interface ProcessedLink {
  id: string;
  sourceId: string;
  targetId: string;
  pathData: string;
  isSelected: boolean;
  isRemoved: boolean;
  stroke: string;
  opacity: number;
  path2d?: Path2D;
}

interface ZoomLevelCache {
  canvas: HTMLCanvasElement;
  processedLinks: ProcessedLink[];
}

const zoomLevelCaches = new Map<ZoomLevel, ZoomLevelCache>();
let currentZoomLevel: ZoomLevel = 1;
let cachedProcessedLinks: ProcessedLink[] = [];

const calculateStyles = (
  isRemoved: boolean,
  isSelected: boolean,
  isHovered: boolean,
): { stroke: string; opacity: number } => {
  return getLinkStyle(isRemoved, isSelected, isHovered, 0.4, 0.9);
};

const drawLinksCanvas = async (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  edgeData: Map<string, FullData>,
  x: d3.ScaleBand<string>,
  selectedNodes: Set<string>,
  mode: LinkRenderingMode,
  edgeChanges: DataChanges,
  fdebSettings: ForceEdgeBundlingOptions,
  angleMap: Map<string, number>,
  hoveredNode: string | null,
  outerRadius: number,
  initialZoomFactor: number = 1,
  signal?: AbortSignal,
) => {
  if (signal?.aborted) return;

  const requiredRadius = outerRadius + 50;
  const canvasSize = Math.ceil(requiredRadius * 2);
  const center = canvasSize / 2;

  let linkGroup = svg.select<SVGGElement>("g.links-group");
  if (linkGroup.empty()) {
    linkGroup = svg
      .append("g")
      .attr("class", "links-group")
      .style("will-change", "opacity, stroke");
  }

  let fdebPaths: (string | null)[] = [];
  if (mode === "fdeB") {
    try {
      fdebPaths = await createFdebPathsWorker(
        edgeData,
        x,
        outerRadius - 0.5,
        fdebSettings,
        signal,
      );
      if (signal?.aborted) return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("Error in FDEB calulation: ", error);
      throw error;
    }
  }

  if (signal?.aborted) return;

  const processedLinks: ProcessedLink[] = [];
  const edgeEntries = Array.from(edgeData.entries());

  for (let i = 0; i < edgeEntries.length; i++) {
    const [edgeId] = edgeEntries[i];
    const [sourceId, targetId] = edgeId.split("|");

    const isRemoved = edgeChanges.removed[edgeId] ? true : false;
    const isSelected =
      selectedNodes.has(sourceId) || selectedNodes.has(targetId);
    let pathData: string | null = null;
    if (mode === "bezier") {
      const sourceAngle = angleMap.get(sourceId);
      const targetAngle = angleMap.get(targetId);
      if (sourceAngle !== undefined && targetAngle !== undefined) {
        pathData = createBezierPath(sourceAngle, targetAngle, outerRadius);
      }
    } else if (mode === "hierarchy") {
      const sourceAngle = angleMap.get(sourceId);
      const targetAngle = angleMap.get(targetId);
      if (sourceAngle !== undefined && targetAngle !== undefined) {
        pathData = createHierarchyPath(sourceAngle, targetAngle, outerRadius);
      }
    } else if (mode === "fdeB") {
      pathData = fdebPaths[i] ?? null;
    }
    if (!pathData) continue;
    const path2d = new Path2D(pathData);
    processedLinks.push({
      id: `${sourceId}-${targetId}`,
      sourceId,
      targetId,
      pathData,
      isSelected,
      isRemoved,
      stroke: isRemoved ? "red" : "#999",
      opacity: isRemoved ? 0.2 : 0.4,
      path2d,
    });
  }

  cachedProcessedLinks = processedLinks;

  ZOOM_LEVELS.forEach((zoomLevel) => {
    const offscreenCanvas = document.createElement("canvas");
    const pixelRatio = zoomLevel;
    const bufferSize = Math.floor(canvasSize * pixelRatio);

    offscreenCanvas.width = bufferSize;
    offscreenCanvas.height = bufferSize;

    const ctx = offscreenCanvas.getContext("2d", { alpha: true });
    if (ctx) {
      drawCanvasLinks(ctx, processedLinks, center, pixelRatio);
    }

    zoomLevelCaches.set(zoomLevel, {
      canvas: offscreenCanvas,
      processedLinks: processedLinks,
    });
  });

  const displayCanvas = getOrCreateCanvas(linkGroup, canvasSize, center);

  currentZoomLevel = getClosestZoomLevel(initialZoomFactor);
  swapToZoomLevel(displayCanvas, currentZoomLevel, canvasSize);

  let highlightGroup = linkGroup.select<SVGGElement>("g.links-highlight");
  if (highlightGroup.empty()) {
    highlightGroup = linkGroup
      .append("g")
      .attr("class", "links-highlight")
      .style("pointer-events", "none");
  }

  updateHighlightPaths(highlightGroup, selectedNodes, hoveredNode);
};

function swapToZoomLevel(
  displayCanvas: d3.Selection<HTMLCanvasElement, unknown, null, undefined>,
  zoomLevel: ZoomLevel,
  canvasSize: number,
): void {
  const cache = zoomLevelCaches.get(zoomLevel);
  if (!cache) return;

  const node = displayCanvas.node();
  if (!node) return;

  const bufferSize = Math.floor(canvasSize * zoomLevel);
  node.width = bufferSize;
  node.height = bufferSize;

  const ctx = node.getContext("2d", { alpha: true });
  if (!ctx) return;

  ctx.drawImage(cache.canvas, 0, 0, bufferSize, bufferSize);

  currentZoomLevel = zoomLevel;
}

function getOrCreateCanvas(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  canvasSize: number,
  center: number,
): d3.Selection<HTMLCanvasElement, unknown, null, undefined> {
  let foreignObject = g.select<SVGForeignObjectElement>(
    "foreignObject.link-canvas-container",
  );

  const displaySize = canvasSize;

  if (foreignObject.empty()) {
    foreignObject = g
      .append("foreignObject")
      .attr("class", "link-canvas-container")
      .attr("x", -center)
      .attr("y", -center)
      .attr("width", displaySize)
      .attr("height", displaySize)
      .style("pointer-events", "none");
  } else {
    foreignObject
      .attr("x", -center)
      .attr("y", -center)
      .attr("width", displaySize)
      .attr("height", displaySize);
  }

  let canvas = foreignObject.select<HTMLCanvasElement>("canvas");

  if (canvas.empty()) {
    const initialBufferSize = displaySize;

    canvas = foreignObject
      .append("xhtml:canvas")
      .attr("class", "link-canvas")
      .attr("width", initialBufferSize)
      .attr("height", initialBufferSize)
      .style("width", `${displaySize}px`)
      .style("height", `${displaySize}px`)
      .style("pointer-events", "none") as unknown as d3.Selection<
      HTMLCanvasElement,
      unknown,
      null,
      undefined
    >;
  } else {
    canvas
      .style("width", `${displaySize}px`)
      .style("height", `${displaySize}px`);
  }

  return canvas as d3.Selection<HTMLCanvasElement, unknown, null, undefined>;
}

function drawCanvasLinks(
  ctx: CanvasRenderingContext2D,
  processedLinks: ProcessedLink[],
  center: number,
  pixelRatio: number,
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.save();
  ctx.scale(pixelRatio, pixelRatio);
  ctx.translate(center, center);

  processedLinks.forEach((link) => {
    ctx.strokeStyle = link.stroke;
    ctx.globalAlpha = link.opacity;
    ctx.lineWidth = 1;
    ctx.stroke(link.path2d!);
  });

  ctx.restore();
}

function updateHighlightPaths(
  highlightGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
  hoveredNode: string | null,
): void {
  const highlightLinks = cachedProcessedLinks.filter((link) => {
    const isSelected =
      selectedNodes.has(link.sourceId) || selectedNodes.has(link.targetId);
    const isHovered = !!(
      hoveredNode &&
      (link.sourceId === hoveredNode || link.targetId === hoveredNode)
    );
    return isSelected || isHovered;
  });

  const highlightData = highlightLinks.map((link) => {
    const isSelected =
      selectedNodes.has(link.sourceId) || selectedNodes.has(link.targetId);
    const isHovered = !!(
      hoveredNode &&
      (link.sourceId === hoveredNode || link.targetId === hoveredNode)
    );
    const style = calculateStyles(link.isRemoved, isSelected, isHovered);

    return {
      ...link,
      stroke: style.stroke,
      opacity: style.opacity,
    };
  });

  highlightGroup
    .selectAll<SVGPathElement, ProcessedLink>("path")
    .data(highlightData, (d) => d.id)
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("d", (d) => d.pathData)
          .attr("fill", "none")
          .attr("stroke", (d) => d.stroke)
          .attr("stroke-width", 2)
          .attr("opacity", 0)
          .call((enter) => enter.attr("opacity", (d) => d.opacity)),
      (update) =>
        update.call((update) =>
          update
            .attr("d", (d) => d.pathData)
            .attr("stroke", (d) => d.stroke)
            .attr("opacity", (d) => d.opacity),
        ),
      (exit) => exit.call((exit) => exit.attr("opacity", 0).remove()),
    );
}

export default drawLinksCanvas;

export const updateLinkHighlightCanvas = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
  hoveredNode: string | null,
) => {
  const linkGroup = svg.select<SVGGElement>("g.links-group");
  if (linkGroup.empty()) return;

  const highlightGroup = linkGroup.select<SVGGElement>("g.links-highlight");
  if (highlightGroup.empty()) return;

  updateHighlightPaths(highlightGroup, selectedNodes, hoveredNode);
};

export function redrawLinksCanvasOnZoom(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  outerRadius: number,
  zoomFactor: number = 1,
): void {
  const targetZoomLevel = getClosestZoomLevel(zoomFactor);

  if (targetZoomLevel === currentZoomLevel) return;

  const linkGroup = svg.select<SVGGElement>("g.links-group");
  if (linkGroup.empty()) return;

  const requiredRadius = outerRadius + 50;
  const canvasSize = Math.ceil(requiredRadius * 2);

  const foreignObject = linkGroup.select<SVGForeignObjectElement>(
    "foreignObject.link-canvas-container",
  );
  if (foreignObject.empty()) return;

  const canvas = foreignObject.select<HTMLCanvasElement>("canvas");
  if (canvas.empty()) return;

  swapToZoomLevel(canvas, targetZoomLevel, canvasSize);
}
