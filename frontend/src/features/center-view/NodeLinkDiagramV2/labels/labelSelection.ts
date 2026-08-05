import type { GraphNode } from "@/types";
import type { ImportanceSortCache } from "../NodeLinkDiagram";

// making use of cache, to not sort on every frame
const getSortedByImportance = (
  nodes: GraphNode[],
  importanceVersion: number,
  cache: ImportanceSortCache,
): GraphNode[] => {
  if (cache.nodes === nodes && cache.version === importanceVersion) {
    return cache.sorted;
  }

  cache.sorted = [...nodes].sort(
    (a, b) => (b.importance ?? 0) - (a.importance ?? 0),
  );
  cache.nodes = nodes;
  cache.version = importanceVersion;
  return cache.sorted;
};

const getLabelBudget = (
  globalScale: number,
  visibleNodeCount: number,
): number => {
  if (globalScale < 0.2) return 0;

  const budget = 12 * Math.pow(globalScale, 1.4);

  return Math.min(visibleNodeCount, Math.round(budget));
};

const getBudgetedLabelNodes = ({
  nodes,
  globalScale,
  nodeVisibility,
  focusNodes,
  importanceVersion,
  cache,
}: {
  nodes: GraphNode[];
  globalScale: number;
  nodeVisibility: (node: GraphNode) => boolean;
  focusNodes: Set<GraphNode>;
  importanceVersion: number;
  cache: ImportanceSortCache;
}): Set<GraphNode> => {
  const visibleNodeCount = nodes.reduce(
    (count, node) => count + (nodeVisibility(node) ? 1 : 0),
    0,
  );

  const budget = getLabelBudget(globalScale, visibleNodeCount);
  if (budget <= 0) return new Set();

  const sortedNodes = getSortedByImportance(nodes, importanceVersion, cache);
  const labelNodes = new Set<GraphNode>();

  for (const node of sortedNodes) {
    if (labelNodes.size >= budget) break;
    if (focusNodes.has(node)) continue;
    if (!node.label) continue;
    if (!nodeVisibility(node)) continue;
    labelNodes.add(node);
  }

  return labelNodes;
};

export const getLabelNodes = ({
  nodes,
  globalScale,
  nodeVisibility,
  hoveredNode,
  selectedNodes,
  neighborNodes,
  focusNodes,
  importanceVersion,
  cache,
}: {
  nodes: GraphNode[];
  globalScale: number;
  nodeVisibility: (node: GraphNode) => boolean;
  hoveredNode: GraphNode | null;
  selectedNodes: Set<GraphNode>;
  neighborNodes: Set<GraphNode>;
  focusNodes: Set<GraphNode>;
  importanceVersion: number;
  cache: ImportanceSortCache;
}): Set<GraphNode> => {
  // hovered node neighbor labels are always drawn
  if (hoveredNode) return neighborNodes;

  // suppress budget-based labels while a selection is active
  if (selectedNodes.size > 0) return new Set();

  return getBudgetedLabelNodes({
    nodes,
    globalScale,
    nodeVisibility,
    focusNodes,
    importanceVersion,
    cache,
  });
};
