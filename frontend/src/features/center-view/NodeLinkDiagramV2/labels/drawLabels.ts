import type { GraphNode } from "@/types";
import {
  LABEL_BG_PAD_X,
  LABEL_BG_PAD_Y,
  LABEL_GAP,
  NODE_R,
} from "../constants";
import type { ImportanceSortCache } from "../NodeLinkDiagram";
import { getLabelNodes } from "./labelSelection";
import { drawNodeHighlight } from "./nodeHighlight";

// keeps label sizing consistent across zoom levels
const getLabelMetrics = (globalScale: number) => {
  const fontSize = Math.max(1, 12 / globalScale);
  const gap = Math.max(0.2, LABEL_GAP / globalScale);
  const padX = Math.max(0.2, LABEL_BG_PAD_X / globalScale);
  const padY = Math.max(0.2, LABEL_BG_PAD_Y / globalScale);
  const bgHeight = fontSize + padY * 2;

  return {
    fontSize,
    gap,
    padX,
    padY,
    bgHeight,
    ringRadius: Math.max(NODE_R, bgHeight / 2),
  };
};

export const drawLabels = ({
  ctx,
  globalScale,
  nodes,
  nodeVisibility,
  hoveredNode,
  selectedNodes,
  neighborNodes,
  importanceVersion,
  importanceSortCache,
}: {
  ctx: CanvasRenderingContext2D;
  globalScale: number;
  nodes: GraphNode[];
  nodeVisibility: (node: GraphNode) => boolean;
  hoveredNode: GraphNode | null;
  selectedNodes: Set<GraphNode>;
  neighborNodes: Set<GraphNode>;
  importanceVersion: number;
  importanceSortCache: ImportanceSortCache;
}) => {
  const { fontSize, gap, padX, bgHeight, ringRadius } =
    getLabelMetrics(globalScale);

  ctx.font = `${fontSize}px sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // selected nodes and the hovered node receive the stronger highlight treatment
  const focusNodes = new Set<GraphNode>(selectedNodes);
  if (hoveredNode) focusNodes.add(hoveredNode);

  // Select nodes that receive plain labels, (focus nodes are highlighted separately)
  const labelNodes = getLabelNodes({
    nodes,
    globalScale,
    nodeVisibility,
    hoveredNode,
    selectedNodes,
    neighborNodes,
    focusNodes,
    importanceVersion,
    cache: importanceSortCache,
  });

  // 1. plain nodes
  for (const node of nodes) {
    if (focusNodes.has(node) || !labelNodes.has(node)) continue;
    if (node.x === undefined || node.y === undefined || !node.label) continue;
    if (!nodeVisibility(node)) continue;

    // "middle" baseline centers on the ascent/descent box, not the glyph
    // ink, so it drifts at different zoom levels, using real bounds instead
    const metrics = ctx.measureText(node.label);
    const ascent = metrics.actualBoundingBoxAscent ?? 0;
    const descent = metrics.actualBoundingBoxDescent ?? 0;

    ctx.fillStyle = "#fff";
    ctx.fillText(
      node.label,
      node.x + NODE_R + gap,
      node.y + (ascent - descent) / 2,
    );
  }

  // 2. selected nodes
  for (const node of focusNodes) {
    if (node === hoveredNode) continue;
    if (node.x === undefined || node.y === undefined || !node.label) continue;
    if (!nodeVisibility(node)) continue;

    drawNodeHighlight(ctx, node, globalScale, { padX, bgHeight, ringRadius });
  }

  // 3. hovered node (drawn last so it wins over all other nodes)
  if (
    hoveredNode &&
    hoveredNode.x !== undefined &&
    hoveredNode.y !== undefined &&
    hoveredNode.label &&
    nodeVisibility(hoveredNode)
  ) {
    drawNodeHighlight(ctx, hoveredNode, globalScale, {
      padX,
      bgHeight,
      ringRadius,
    });
  }
};
