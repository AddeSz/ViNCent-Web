import { type GetColorForMetric } from "@/hooks/useGetColorForMetric";
import type { AttributeInfo, FullData } from "@/types";
import * as d3 from "d3";
import {
  getClosestZoomLevel,
  ZOOM_LEVELS,
  type ZoomLevel,
} from "../hooks/useZoom";

type ArcData = {
  key: string;
  0: number;
  1: number;
  value: any;
  id: string;
  pendingRemoval: boolean | undefined;
  removed: boolean | undefined;
};

export interface ProcessedArc {
  data: ArcData;
  fillColor: string;
  arcOpacity: number;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  fullOuterRadius: number;
  foregroundOuterRadius: number;
  foregroundPath?: Path2D;
  backgroundPath?: Path2D;
}

interface ArcsByColor {
  [color: string]: ProcessedArc[];
}

const zoomLevelCaches = new Map<ZoomLevel, HTMLCanvasElement>();
let currentZoomLevel: ZoomLevel = 1;
let cachedProcessedArcs: ProcessedArc[] = [];

const drawArcsCanvas = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  series: d3.Series<FullData, string>[],
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number>,
  attributeInfo: Map<string, AttributeInfo>,
  getKeyIndex: (key: string) => number,
  outerRadius: number,
  outerArcsWidth: number,
  getColorForMetric: GetColorForMetric,
  initialZoomFactor: number = 1,
): ProcessedArc[] => {
  const requiredRadius = outerRadius + 40 + outerArcsWidth;
  const canvasSize = Math.ceil(requiredRadius * 2);
  const center = Math.floor(canvasSize / 2);

  const g = svg
    .selectAll<SVGGElement, unknown>("g.arcs-group")
    .data([null])
    .join("g")
    .attr("class", "arcs-group");

  const processedArcs: ProcessedArc[] = [];
  const arcsByColor: ArcsByColor = {};
  for (const layer of series) {
    const key = layer.key;
    const layerInnerRadius = y(getKeyIndex(key)) + 0.5;
    const layerFullOuterRadius = y(getKeyIndex(key) + 1);
    const attribute = attributeInfo.get(key);
    let min = 0;
    let max = 1;
    let range = 1;
    if (attribute?.isNumeric && attribute.range) {
      ({ min, max } = attribute.range);
      const diff = max - min;
      const epsilon = 1e-9;

      range = Math.abs(diff) < epsilon ? 1 : diff;
    }

    for (let i = 0; i < layer.length; i++) {
      const d = layer[i];
      const datum = d.data;
      const id = datum.id;
      const value = datum[key as keyof FullData];
      const pendingRemoval = datum.pendingRemoval === true;

      const startAngle = x(id) ?? 0;
      const endAngle = startAngle + x.bandwidth();

      let foregroundOuterRadius = layerFullOuterRadius - 0.5;
      let proportion;
      if (
        typeof value === "number" &&
        attribute?.isNumeric &&
        !attribute.isCategory
      ) {
        if (Math.abs(max - min) < 1e-9) {
          proportion = 1;
        } else {
          proportion =
            Math.ceil(Math.max(0, Math.min(1, (value - min) / range)) * 100) /
            100;
        }
        foregroundOuterRadius =
          layerInnerRadius +
          (layerFullOuterRadius - layerInnerRadius) * proportion;
      }

      const fillColor = pendingRemoval ? "red" : getColorForMetric(key, value);
      const arcOpacity = pendingRemoval ? 0.6 : 1;

      const foregroundPath = new Path2D();
      foregroundPath.arc(
        0,
        0,
        foregroundOuterRadius,
        startAngle,
        endAngle,
        false,
      );
      foregroundPath.lineTo(
        layerInnerRadius * Math.cos(endAngle),
        layerInnerRadius * Math.sin(endAngle),
      );
      foregroundPath.arc(0, 0, layerInnerRadius, endAngle, startAngle, true);
      foregroundPath.closePath();

      let backgroundPath: Path2D | undefined;
      if (foregroundOuterRadius < layerFullOuterRadius) {
        backgroundPath = new Path2D();
        backgroundPath.arc(
          0,
          0,
          layerFullOuterRadius,
          startAngle,
          endAngle,
          false,
        );
        backgroundPath.lineTo(
          foregroundOuterRadius * Math.cos(endAngle),
          foregroundOuterRadius * Math.sin(endAngle),
        );
        backgroundPath.arc(
          0,
          0,
          foregroundOuterRadius,
          endAngle,
          startAngle,
          true,
        );
        backgroundPath.closePath();
      }

      const arc: ProcessedArc = {
        data: {
          key,
          value,
          id,
          pendingRemoval,
          removed: datum.removed,
          0: d[0],
          1: d[1],
        },
        fillColor,
        arcOpacity,
        startAngle,
        endAngle,
        innerRadius: layerInnerRadius,
        fullOuterRadius: layerFullOuterRadius,
        foregroundOuterRadius,
        foregroundPath,
        backgroundPath,
      };

      processedArcs.push(arc);

      if (!datum.removed && value !== null) {
        const colorKey = `${fillColor}_${arcOpacity}`;
        if (!arcsByColor[colorKey]) {
          arcsByColor[colorKey] = [];
        }
        arcsByColor[colorKey].push(arc);
      }
    }
  }

  cachedProcessedArcs = processedArcs;

  ZOOM_LEVELS.forEach((zoomLevel) => {
    const offscreenCanvas = document.createElement("canvas");
    const pixelRatio = zoomLevel;
    const bufferSize = Math.floor(canvasSize * pixelRatio);

    offscreenCanvas.width = bufferSize;
    offscreenCanvas.height = bufferSize;

    const ctx = offscreenCanvas.getContext("2d");
    if (ctx) {
      drawCanvasArcs(ctx, arcsByColor, center, pixelRatio);
    }

    zoomLevelCaches.set(zoomLevel, offscreenCanvas);
  });

  const displayCanvas = getOrCreateCanvas(
    g as unknown as d3.Selection<SVGGElement, unknown, null, undefined>,
    canvasSize,
    center,
  );

  currentZoomLevel = getClosestZoomLevel(initialZoomFactor);
  swapToZoomLevel(displayCanvas, currentZoomLevel, canvasSize);

  return processedArcs;
};

function swapToZoomLevel(
  displayCanvas: d3.Selection<HTMLCanvasElement, unknown, null, undefined>,
  zoomLevel: ZoomLevel,
  canvasSize: number,
): void {
  const cachedCanvas = zoomLevelCaches.get(zoomLevel);
  if (!cachedCanvas) return;

  const node = displayCanvas.node();
  if (!node) return;

  const bufferSize = Math.floor(canvasSize * zoomLevel);
  node.width = bufferSize;
  node.height = bufferSize;

  const ctx = node.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(cachedCanvas, 0, 0, bufferSize, bufferSize);

  currentZoomLevel = zoomLevel;
}

export function redrawArcsCanvasOnZoom(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  outerRadius: number,
  changeCircleRadius: number,
  zoomFactor: number = 1,
): void {
  const g = svg.select<SVGGElement>("g.arcs-group");
  if (g.empty()) return;

  const requiredRadius = outerRadius + 50 + changeCircleRadius;
  const canvasSize = Math.ceil(requiredRadius * 2);

  const foreignObject = g.select<SVGForeignObjectElement>(
    "foreignObject.arc-canvas-container",
  );
  if (foreignObject.empty()) return;

  const canvas = foreignObject.select<HTMLCanvasElement>("canvas");
  if (canvas.empty()) return;

  swapToZoomLevel(canvas, zoomFactor as ZoomLevel, canvasSize);
}

export function getProcessedArcs(): ProcessedArc[] {
  return cachedProcessedArcs;
}

function getOrCreateCanvas(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  canvasSize: number,
  center: number,
): d3.Selection<HTMLCanvasElement, unknown, null, undefined> {
  let foreignObject = g.select<SVGForeignObjectElement>(
    "foreignObject.arc-canvas-container",
  );
  const displaySize = canvasSize;

  if (foreignObject.empty()) {
    foreignObject = g
      .append("foreignObject")
      .attr("class", "arc-canvas-container")
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
      .attr("class", "arc-canvas")
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
      .style("height", `${displaySize}px`)
      .style("pointer-events", "none");
  }

  return canvas as d3.Selection<HTMLCanvasElement, unknown, null, undefined>;
}

function drawCanvasArcs(
  ctx: CanvasRenderingContext2D,
  arcsByColor: ArcsByColor,
  center: number,
  pixelRatio: number,
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const backgroundColor = "#171717";

  ctx.save();
  ctx.scale(pixelRatio, pixelRatio);
  ctx.translate(center, center);
  ctx.rotate(-Math.PI / 2);

  ctx.fillStyle = backgroundColor;
  ctx.globalAlpha = 0.7;

  for (const colorKey in arcsByColor) {
    const arcs = arcsByColor[colorKey];
    for (const arc of arcs) {
      if (arc.backgroundPath) {
        ctx.fill(arc.backgroundPath);
      }
    }
  }

  for (const colorKey in arcsByColor) {
    const arcs = arcsByColor[colorKey];
    if (arcs.length === 0) continue;

    ctx.fillStyle = arcs[0].fillColor;
    ctx.globalAlpha = arcs[0].arcOpacity;

    for (const arc of arcs) {
      ctx.fill(arc.foregroundPath!);
    }
  }

  ctx.restore();
}

export default drawArcsCanvas;
