import type { GraphNode } from "@/types";
import { highlightColor } from "@/utils/ColorHelper";
import {
  DEFAULT_NODE_COLOR,
  RING_MAX_WIDTH,
  RING_MIN_WIDTH,
} from "../constants";

export const drawNodeHighlight = (
  ctx: CanvasRenderingContext2D,
  node: GraphNode,
  globalScale: number,
  metrics: { padX: number; bgHeight: number; ringRadius: number },
) => {
  const x = node.x as number;
  const y = node.y as number;
  const label = node.label as string;
  const { padX, bgHeight, ringRadius } = metrics;
  const r = node.size;

  // disc reaches the pills edge so ring + pill read as one shape
  ctx.beginPath();
  ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
  ctx.fillStyle = highlightColor.hovered;
  ctx.fill();

  const textMetrics = ctx.measureText(label);

  const pillX = x;
  const pillY = y - bgHeight / 2;
  const pillWidth = textMetrics.width + padX * 2 + r;
  const pillRadius = bgHeight / 2;

  ctx.beginPath();
  ctx.moveTo(pillX, pillY);
  ctx.lineTo(pillX + pillWidth - pillRadius, pillY);
  ctx.arcTo(
    pillX + pillWidth,
    pillY,
    pillX + pillWidth,
    pillY + pillRadius,
    pillRadius,
  );
  ctx.lineTo(pillX + pillWidth, pillY + bgHeight - pillRadius);
  ctx.arcTo(
    pillX + pillWidth,
    pillY + bgHeight,
    pillX + pillWidth - pillRadius,
    pillY + bgHeight,
    pillRadius,
  );
  ctx.lineTo(pillX, pillY + bgHeight);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff";
  const ascent = textMetrics.actualBoundingBoxAscent ?? 0;
  const descent = textMetrics.actualBoundingBoxDescent ?? 0;

  // "middle" baseline centers on the ascent/descent box, not the glyph
  // ink, so it drifts at different zoom levels, using real bounds instead
  ctx.fillText(label, x + r + padX, y + (ascent - descent) / 2);

  // redraw the center dot last so the pill highlight never covers it
  const strokeWidth = Math.min(
    RING_MAX_WIDTH,
    Math.max(RING_MIN_WIDTH, 2 / globalScale),
  );

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = DEFAULT_NODE_COLOR;
  ctx.fill();

  ctx.lineWidth = strokeWidth;
  ctx.strokeStyle = highlightColor.hovered;
  ctx.stroke();
};
