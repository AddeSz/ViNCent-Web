import { useMetricsStore } from "@/stores/useMetricsStore";
import type { AttributeInfo, DataChanges, FullData } from "@/types/network";
import { handleHighlight } from "@/utils/ColorHelper";
import * as d3 from "d3";
import {
  getClosestZoomLevel,
  ZOOM_LEVELS,
  type ZoomLevel,
} from "../hooks/useZoom";
import type { InteractionProps } from "../Tooltips/useTooltip";
import type { BoundsResult } from "./utils/calculateBounds";

type ArcData = {
  key: string;
  0: number;
  1: number;
  value: any;
  id: string;
  removed: boolean | undefined;
  stable: boolean | undefined;
};

interface ProcessedArc {
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

interface ChangeCircle {
  id: string;
  angle: number;
  radius: number;
  color: string;
  changeType: "added" | "removed" | "updated";
}

interface ArcsByColor {
  [color: string]: ProcessedArc[];
}

interface ZoomLevelCache {
  canvas: HTMLCanvasElement;
  processedArcs: ProcessedArc[];
  changeCircles: ChangeCircle[];
}

const zoomLevelCaches = new Map<ZoomLevel, ZoomLevelCache>();
let currentZoomLevel: ZoomLevel = 1;

const drawArcsCanvas = (
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  series: d3.Series<FullData, string>[],
  x: d3.ScaleBand<string>,
  y: d3.ScaleLinear<number, number>,
  attributeInfo: Map<string, AttributeInfo>,
  interactionProps: InteractionProps,
  getKeyIndex: (key: string) => number,
  innerRadius: number,
  outerRadius: number,
  bounds: BoundsResult,
  nodeChanges: DataChanges,
  changeCircleRadius: number,
  initialZoomFactor: number = 1,
): void => {
  const { getColorForMetric } = useMetricsStore.getState();
  const requiredRadius = outerRadius + 50 + changeCircleRadius;
  const canvasSize = Math.ceil(requiredRadius * 2);
  const center = canvasSize / 2;
  const g = svg
    .selectAll<SVGGElement, unknown>("g.arcs-group")
    .data([null])
    .join("g")
    .attr("class", "arcs-group");

  const processedArcs: ProcessedArc[] = [];
  const arcsByColor: ArcsByColor = {};
  for (const layer of series) {
    const key = layer.key;
    const layerInnerRadius = y(getKeyIndex(key));
    const layerFullOuterRadius = y(getKeyIndex(key) + 1);
    const attribute = attributeInfo.get(key);
    let min = 0;
    let max = 1;
    let range = 1;
    if (attribute?.isNumeric && attribute.range) {
      ({ min, max } = attribute.range);
      range = max - min || 1;
    }

    for (let i = 0; i < layer.length; i++) {
      const d = layer[i];
      const datum = d.data;
      const id = datum.id;
      const value = datum[key as keyof FullData];
      const removed = datum.removed === true;

      const startAngle = x(id) ?? 0;
      const endAngle = startAngle + x.bandwidth();

      let foregroundOuterRadius = layerFullOuterRadius;
      if (typeof value === "number" && attribute?.isNumeric) {
        const proportion = Math.max(0, Math.min(1, (value - min) / range));
        foregroundOuterRadius =
          layerInnerRadius +
          (layerFullOuterRadius - layerInnerRadius) * proportion;
      }

      const fillColor = removed ? "red" : getColorForMetric(key, value);
      const arcOpacity = removed ? 0.6 : 1;

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
          removed,
          stable: datum.stable,
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

      if (!datum.stable) {
        const colorKey = `${fillColor}_${arcOpacity}`;
        if (!arcsByColor[colorKey]) {
          arcsByColor[colorKey] = [];
        }
        arcsByColor[colorKey].push(arc);
      }
    }
  }

  const changeCircles: ChangeCircle[] = [];
  const getChangeType = (
    id: string,
  ): "added" | "removed" | "updated" | null => {
    if (nodeChanges?.added && id in nodeChanges.added) return "added";
    if (nodeChanges?.removed && id in nodeChanges.removed) return "removed";
    if (
      nodeChanges?.updated &&
      Object.prototype.hasOwnProperty.call(nodeChanges.updated, id)
    )
      return "updated";
    return null;
  };

  const getFillColor = (
    changeType: "added" | "removed" | "updated" | null,
  ): string => {
    if (changeType === "added") return "green";
    if (changeType === "removed") return "red";
    if (changeType === "updated") return "yellow";
    return "none";
  };

  const domain = x.domain();
  for (const id of domain) {
    const changeType = getChangeType(id);
    if (!changeType) continue;

    const angle = x(id)! + x.bandwidth() / 2;
    const color = getFillColor(changeType);
    const circleRadius = outerRadius + changeCircleRadius * 2;

    changeCircles.push({
      id,
      angle,
      radius: circleRadius,
      color,
      changeType,
    });
  }

  const nodeCount = series[0]?.length || 0;

  ZOOM_LEVELS.forEach((zoomLevel) => {
    const offscreenCanvas = document.createElement("canvas");
    const pixelRatio = zoomLevel;
    const bufferSize = Math.floor(canvasSize * pixelRatio);

    offscreenCanvas.width = bufferSize;
    offscreenCanvas.height = bufferSize;

    const ctx = offscreenCanvas.getContext("2d");
    if (ctx) {
      drawCanvasArcs(ctx, arcsByColor, center, pixelRatio);
      drawBoundsOnCanvas(
        ctx,
        bounds,
        innerRadius,
        outerRadius,
        canvasSize,
        pixelRatio,
        nodeCount,
      );
      drawChangeCirclesOnCanvas(
        ctx,
        changeCircles,
        changeCircleRadius,
        center,
        pixelRatio,
      );
    }

    zoomLevelCaches.set(zoomLevel, {
      canvas: offscreenCanvas,
      processedArcs: processedArcs,
      changeCircles: changeCircles,
    });
  });

  const displayCanvas = getOrCreateCanvas(
    g as unknown as d3.Selection<SVGGElement, unknown, null, undefined>,
    canvasSize,
    center,
  );

  currentZoomLevel = getClosestZoomLevel(initialZoomFactor);
  swapToZoomLevel(displayCanvas, currentZoomLevel, canvasSize);

  const cache = zoomLevelCaches.get(currentZoomLevel);
  if (cache) {
    setupCanvasInteractions(
      displayCanvas,
      cache.processedArcs,
      cache.changeCircles,
      interactionProps,
      center,
      canvasSize,
      changeCircleRadius,
      nodeChanges,
    );
  }
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

  const ctx = node.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(cache.canvas, 0, 0, bufferSize, bufferSize);

  currentZoomLevel = zoomLevel;
}

export function redrawArcsCanvasOnZoom(
  svg: d3.Selection<SVGGElement, unknown, null, undefined>,
  outerRadius: number,
  changeCircleRadius: number,
  zoomFactor: number = 1,
): void {
  const targetZoomLevel = getClosestZoomLevel(zoomFactor);

  if (targetZoomLevel === currentZoomLevel) return;

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

  swapToZoomLevel(canvas, targetZoomLevel, canvasSize);
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
      .style("pointer-events", "all") as unknown as d3.Selection<
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

function drawBoundsOnCanvas(
  ctx: CanvasRenderingContext2D,
  bounds: BoundsResult,
  innerRadius: number,
  outerRadius: number,
  canvasSize: number,
  pixelRatio: number,
  nodeCount: number,
): void {
  const { groupBounds, layerBounds } = bounds;

  ctx.save();

  ctx.scale(pixelRatio, pixelRatio);
  const center = canvasSize / 2;
  ctx.translate(center, center);
  ctx.rotate(-Math.PI / 2);

  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;

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
    if (nodeCount > 850) {
      groupBounds.forEach((group) => {
        const angle = group.startAngle;
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
    } else {
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
  }

  ctx.restore();
}

function drawChangeCirclesOnCanvas(
  ctx: CanvasRenderingContext2D,
  circles: ChangeCircle[],
  circleRadius: number,
  center: number,
  pixelRatio: number,
): void {
  ctx.save();
  ctx.scale(pixelRatio, pixelRatio);
  ctx.translate(center, center);
  ctx.rotate(-Math.PI / 2);

  for (const circle of circles) {
    const x = Math.cos(circle.angle) * circle.radius;
    const y = Math.sin(circle.angle) * circle.radius;

    ctx.beginPath();
    ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
    ctx.fillStyle = circle.color;
    ctx.globalAlpha = 1;
    ctx.fill();
  }

  ctx.restore();
}

function setupCanvasInteractions(
  canvas: d3.Selection<HTMLCanvasElement, unknown, null, undefined>,
  processedArcs: ProcessedArc[],
  changeCircles: ChangeCircle[],
  interactionProps: InteractionProps,
  center: number,
  canvasSize: number,
  changeCircleRadius: number,
  nodeChanges: DataChanges,
): void {
  const { onNodeHover, onContextMenu, onTooltipShow, onTooltipHide } =
    interactionProps;

  let hoveredArc: ProcessedArc | null = null;
  let hoveredCircle: ChangeCircle | null = null;

  function getArcAtPoint(x: number, y: number): ProcessedArc | null {
    const canvasX = x - center;
    const canvasY = y - center;

    const angle = Math.atan2(canvasY, canvasX) + Math.PI / 2;
    const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
    const radius = Math.sqrt(canvasX * canvasX + canvasY * canvasY);

    for (const arc of processedArcs) {
      if (
        normalizedAngle >= arc.startAngle &&
        normalizedAngle <= arc.endAngle &&
        radius >= arc.innerRadius &&
        radius <= arc.fullOuterRadius
      ) {
        return arc;
      }
    }
    return null;
  }

  function getCircleAtPoint(x: number, y: number): ChangeCircle | null {
    const canvasX = x - center;
    const canvasY = y - center;

    const rotatedX =
      canvasX * Math.cos(Math.PI / 2) - canvasY * Math.sin(Math.PI / 2);
    const rotatedY =
      canvasX * Math.sin(Math.PI / 2) + canvasY * Math.cos(Math.PI / 2);

    for (const circle of changeCircles) {
      const circleX = Math.cos(circle.angle) * circle.radius;
      const circleY = Math.sin(circle.angle) * circle.radius;

      const distance = Math.sqrt(
        Math.pow(rotatedX - circleX, 2) + Math.pow(rotatedY - circleY, 2),
      );

      if (distance <= changeCircleRadius) {
        return circle;
      }
    }
    return null;
  }

  canvas
    .on("mousemove", function (event) {
      const rect = this.getBoundingClientRect();
      const scaleX = canvasSize / rect.width;
      const scaleY = canvasSize / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      const circle = getCircleAtPoint(x, y);
      const arc = circle ? null : getArcAtPoint(x, y);

      if (circle !== hoveredCircle || arc !== hoveredArc) {
        hoveredCircle = circle;
        hoveredArc = arc;

        if (circle || arc) {
          (this as HTMLCanvasElement).style.cursor = "pointer";
          if (arc) {
            onNodeHover(arc.data.id);
          }
        } else {
          (this as HTMLCanvasElement).style.cursor = "default";
        }
      }

      if (circle) {
        onTooltipShow({
          type: "change",
          nodeId: circle.id,
          x: event.clientX,
          y: event.clientY,
          lastChange: nodeChanges,
        });
      } else if (arc) {
        onTooltipShow({
          type: "arc",
          nodeId: arc.data.id,
          x: event.clientX,
          y: event.clientY,
          arcKey: arc.data.key,
        });
      } else {
        onTooltipHide();
      }
    })
    .on("mouseout", function () {
      if (hoveredArc || hoveredCircle) {
        hoveredArc = null;
        hoveredCircle = null;
        (this as HTMLCanvasElement).style.cursor = "default";
        onTooltipHide();
      }
    })
    .on("contextmenu", function (event) {
      const rect = this.getBoundingClientRect();
      const scaleX = canvasSize / rect.width;
      const scaleY = canvasSize / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      const circle = getCircleAtPoint(x, y);
      const arc = circle ? null : getArcAtPoint(x, y);

      if (arc) {
        (event as any)._handledByChild = true;
        onContextMenu("arc", arc.data);
      }
    })
    .on("click", function (event) {
      const rect = this.getBoundingClientRect();
      const scaleX = canvasSize / rect.width;
      const scaleY = canvasSize / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;

      const circle = getCircleAtPoint(x, y);
      const arc = circle ? null : getArcAtPoint(x, y);

      if (arc) {
        const multi = event.shiftKey || event.ctrlKey;
        handleHighlight(arc.data.id, multi);
      }
    });
}

export default drawArcsCanvas;
