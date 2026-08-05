import { useNetworkStore } from "@/stores/useNetworkStore";
import type {
  DataChanges,
  GraphLink,
  GraphNode,
  ViewEdge,
  ViewFlags,
  ViewNode,
} from "@/types";
import { colorBlend, highlightColor } from "@/utils/ColorHelper";
import { useCallback, useRef } from "react";
import ForceGraph2D from "react-force-graph-2d";
import {
  DEFAULT_EDGE_COLOR,
  DEFAULT_LINK_WIDTH,
  DEFAULT_NODE_COLOR,
  DIMMED_NODE_OPACITY,
  HIGHLIGHT_LINK_WIDTH,
  NODE_R,
  RING_MAX_WIDTH,
  RING_MIN_WIDTH,
} from "./constants";
import { useElementSize } from "./hooks/useElementSize";
import { useForceGraphData } from "./hooks/useForceGraphData";
import { useGraphInteraction } from "./hooks/useGraphInteraction";
import { useGraphSync } from "./hooks/useGraphSync";
import { drawLabels } from "./labels/drawLabels";

// Must stay in sync with the backgroundColor prop below
// colorBlend uses this as a hardcoded snapshot, not a live read
const CANVAS_BACKGROUND = "#262626";

export interface ImportanceSortCache {
  nodes: GraphNode[] | null;
  version: number;
  sorted: GraphNode[];
}

const resolveFlagColor = (flags: ViewFlags | undefined): string | null => {
  if (!flags) return null;
  if (flags.added) return highlightColor.added;
  if (flags.pendingRemoval) return highlightColor.removed;
  return null;
};

interface NodeLinkDiagramProps {
  nodeData: Map<string, ViewNode>;
  edgeData: Map<string, ViewEdge>;
  nodeChanges: DataChanges;
  edgeChanges: DataChanges;
  isActive: boolean;
}

const NodeLinkDiagram = ({
  nodeData,
  edgeData,
  isActive,
}: NodeLinkDiagramProps) => {
  const importanceVersionRef = useRef<number>(0);
  const importanceSortCacheRef = useRef<ImportanceSortCache>({
    nodes: null,
    version: -1,
    sorted: [],
  });
  const dimmedColorCache = useRef<Map<string, string>>(new Map());

  const { ref: wrapperRef, size } = useElementSize<HTMLDivElement>(isActive);

  const fullNetwork = useNetworkStore((s) => s.fullNetwork);
  const { graphData, nodesById, linksById } = useForceGraphData(fullNetwork);

  // Keep graph objects synchronized with the current application state without recreating them
  const currentEdges = useNetworkStore((s) => s.currentEdges);
  const { nodeVisibility, linkVisibility } = useGraphSync({
    nodesById,
    linksById,
    nodeData,
    edgeData,
    currentEdges,
    importanceVersionRef,
  });

  const {
    hoverNodeRef,
    neighborNodesRef,
    neighborLinksRef,
    selectedNodesRef,
    handleNodeHover,
    handleNodeClick,
  } = useGraphInteraction({ nodesById, linksById, nodeData });

  // nodeColor() is called many times per frame, so avoid recalculating
  // the same blended color for nodes sharing the same base color
  const getDimmedColor = useCallback((baseColor: string) => {
    const cache = dimmedColorCache.current;
    const cached = cache.get(baseColor);
    if (cached) return cached;

    const dimmed = colorBlend(
      baseColor,
      CANVAS_BACKGROUND,
      DIMMED_NODE_OPACITY,
    );
    cache.set(baseColor, dimmed);
    return dimmed;
  }, []);

  const linkColor = useCallback(() => DEFAULT_EDGE_COLOR, []);

  const linkWidth = useCallback(
    (link: GraphLink) =>
      neighborLinksRef.current.has(link)
        ? HIGHLIGHT_LINK_WIDTH
        : DEFAULT_LINK_WIDTH,
    [],
  );

  const nodeColor = useCallback(
    (node: GraphNode) => {
      const baseColor = node.color ?? DEFAULT_NODE_COLOR;
      const hasHover = !!hoverNodeRef.current;
      const hasSelection = selectedNodesRef.current.size > 0;
      if (!hasHover && !hasSelection) return baseColor;

      const isEmphasized =
        neighborNodesRef.current.has(node) ||
        selectedNodesRef.current.has(node);
      return isEmphasized ? baseColor : getDimmedColor(baseColor);
    },
    [getDimmedColor],
  );

  const nodeCanvasObjectMode = useCallback(
    (node: GraphNode) => {
      // Hovered/selected nodes are drawn entirely via onRenderFramePost so skip the default per node draw for both
      if (node === hoverNodeRef.current || selectedNodesRef.current.has(node)) {
        return undefined;
      }
      if (neighborNodesRef.current.has(node)) return "after";
      if (resolveFlagColor(nodeData.get(node.id)?.flags)) return "after";
      return undefined;
    },
    [nodeData],
  );

  const nodeCanvasObject = useCallback(
    (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (node.x === undefined || node.y === undefined) return;

      // nodeCanvasObjectMode returns undefined for the hovered/selected node,
      // However, hovered node neighbors are rendered here as rings
      // Their labels are handled separately by drawLabels
      const isHighlightedNeighbor = neighborNodesRef.current.has(node);
      const ringColor =
        (isHighlightedNeighbor ? highlightColor.hoveredNeighbor : null) ??
        resolveFlagColor(nodeData.get(node.id)?.flags);

      if (!ringColor) return;

      const ringWidth = Math.min(
        RING_MAX_WIDTH,
        Math.max(RING_MIN_WIDTH, 2 / globalScale),
      );
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_R, 0, 2 * Math.PI, false);
      ctx.lineWidth = ringWidth;
      ctx.strokeStyle = ringColor;
      ctx.stroke();
    },
    [nodeData],
  );

  // for labels & highlight effects
  const onRenderFramePost = useCallback(
    (ctx: CanvasRenderingContext2D, globalScale: number) => {
      drawLabels({
        ctx,
        globalScale,
        nodes: graphData.nodes,
        nodeVisibility,
        hoveredNode: hoverNodeRef.current,
        selectedNodes: selectedNodesRef.current,
        neighborNodes: neighborNodesRef.current,
        importanceVersion: importanceVersionRef.current,
        importanceSortCache: importanceSortCacheRef.current,
      });
    },
    [graphData.nodes, nodeVisibility],
  );

  return (
    <div ref={wrapperRef} className="h-full w-full">
      <ForceGraph2D
        graphData={graphData}
        backgroundColor={CANVAS_BACKGROUND}
        width={size.width}
        height={size.height}
        nodeRelSize={NODE_R}
        nodeVisibility={nodeVisibility}
        linkVisibility={linkVisibility}
        nodeColor={nodeColor}
        nodeLabel="label"
        nodeCanvasObjectMode={nodeCanvasObjectMode}
        nodeCanvasObject={nodeCanvasObject}
        linkColor={linkColor}
        linkLabel="label"
        onNodeHover={handleNodeHover}
        onNodeClick={handleNodeClick}
        onRenderFramePost={onRenderFramePost}
        linkWidth={linkWidth}
        enablePointerInteraction={true}
        autoPauseRedraw={false}
      />
    </div>
  );
};

export default NodeLinkDiagram;
