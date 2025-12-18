import { useMetricsStore } from "@/stores/useMetricsStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import type {
  DataChanges,
  Edge,
  FullData,
  Network,
  Node,
} from "@/types/network";
import {
  getLinkStyle,
  handleHighlight,
  highlightNodeColor,
} from "@/utils/ColorHelper";
import { getNodeId } from "@/utils/utils";
import * as d3 from "d3";
import { updateLabelPositions } from "./drawLabels";
import { createDrag } from "./setupSimulation";

const OPACITY_VALUE = 0.6;

const calculateLinkEndpoints = (
  source: Node,
  target: Node,
  sourceRadius: number,
  targetRadius: number,
) => {
  const sx = source.x ?? 0;
  const sy = source.y ?? 0;
  const tx = target.x ?? 0;
  const ty = target.y ?? 0;

  const dx = tx - sx;
  const dy = ty - sy;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) {
    return { x1: sx, y1: sy, x2: tx, y2: ty };
  }

  const unitX = dx / distance;
  const unitY = dy / distance;

  const x1 = sx + unitX * sourceRadius;
  const y1 = sy + unitY * sourceRadius;

  const x2 = tx - unitX * targetRadius;
  const y2 = ty - unitY * targetRadius;

  return { x1, y1, x2, y2 };
};

const getNodeStyle = (
  node: Node,
  selectedNodes: Set<string>,
  nodeChanges: DataChanges,
  hoveredNode: string | null,
  nodeData: Map<string, FullData>,
  selectedCommunity: string,
) => {
  const { displaySettings } = useSettingsStore.getState();
  const getColorForMetric = useMetricsStore.getState().getColorForMetric;
  const removed = nodeChanges.removed[node.id] ? true : false;
  const added = nodeChanges.added[node.id] ? true : false;

  const data = nodeData.get(node.id);
  const communityNumber = data?.[selectedCommunity];
  const fill =
    communityNumber !== undefined
      ? getColorForMetric(selectedCommunity, communityNumber)
      : highlightNodeColor.default;

  const isSelected = selectedNodes.has(node.id);
  const isHovered = hoveredNode === node.id;

  const isSecondarySelected = Array.from(selectedNodes).some((selectedId) => {
    const selectedNodeData = nodeData.get(selectedId);
    if (!selectedNodeData || selectedNodeData.stable) return false;
    return selectedNodeData?.linked?.has(node.id);
  });

  const isSecondaryHovered = (() => {
    if (!hoveredNode) return false;
    const hoveredNodeData = nodeData.get(hoveredNode);
    if (!hoveredNodeData || hoveredNodeData.stable) return false;
    return hoveredNodeData?.linked?.has(node.id);
  })();

  const isConnected =
    isSelected || isSecondarySelected || isHovered || isSecondaryHovered;

  const hasActiveSelectedNodes = Array.from(selectedNodes).some((id) => {
    const data = nodeData.get(id);
    return data && !data.stable;
  });

  const opacity = !hasActiveSelectedNodes || isConnected ? 1 : 0.2;

  let stroke = "none";
  let strokeWidth = 0;

  if (added) {
    stroke = highlightNodeColor.added;
    strokeWidth = 3;
  } else if (removed && displaySettings.previewChanges) {
    stroke = highlightNodeColor.removed;
    strokeWidth = 3;
  }

  return {
    fill,
    stroke,
    strokeWidth,
    opacity,
  };
};

const getLinkStyleForNode = (
  link: Edge,
  selectedNodes: Set<string>,
  hoveredNode: string | null,
  edgeChanges: DataChanges,
  nodeData: Map<string, FullData>,
) => {
  const sourceId = getNodeId(link.source);
  const targetId = getNodeId(link.target);
  const isRemoved = edgeChanges.removed[link.id] ? true : false;

  const isSelected =
    (selectedNodes.has(sourceId) && !nodeData.get(sourceId)?.stable) ||
    (selectedNodes.has(targetId) && !nodeData.get(targetId)?.stable);

  const isHovered = (() => {
    if (!hoveredNode || !sourceId || !targetId) return false;
    const hoveredNodeData = nodeData.get(hoveredNode);
    if (!hoveredNodeData || hoveredNodeData.stable) return false;
    return sourceId === hoveredNode || targetId === hoveredNode;
  })();

  const style = getLinkStyle(
    isRemoved,
    isSelected,
    isHovered,
    OPACITY_VALUE,
    0.8,
  );

  const isConnected = isSelected || isHovered;

  const hasActiveSelectedNodes = Array.from(selectedNodes).some((id) => {
    const data = nodeData.get(id);
    return data && !data.stable;
  });

  const dimmedOpacity =
    !hasActiveSelectedNodes || isConnected ? style.opacity : 0.1;

  return {
    stroke: style.stroke,
    strokeOpacity: dimmedOpacity,
  };
};

const handleNodeClick = (event: MouseEvent, d: Node) => {
  const multi = event.shiftKey || event.ctrlKey || event.metaKey;
  handleHighlight(d.id, multi);
};

const updateNodes = (
  nodeGroup: d3.Selection<d3.BaseType, unknown, null, undefined>,
  visibleNodes: Node[],
  simulation: d3.Simulation<Node, Edge>,
  selectedNodes: Set<string>,
  nodeSizes: Map<string, number>,
  nodeChanges: DataChanges,
  hoveredNode: string | null,
  nodeData: Map<string, FullData>,
  selectedCommunity: string,
) => {
  const nodes = nodeGroup
    .selectAll<SVGCircleElement, Node>("circle.node")
    .data(visibleNodes, (d) => d.id);
  nodes
    .exit()
    .transition()
    .duration(250)
    .attr("r", 0)
    .style("opacity", 0)
    .remove();

  const nodesEnter = nodes
    .enter()
    .append("circle")
    .attr("class", "node")
    .attr("r", 0)
    .style("cursor", "pointer")
    .style("opacity", 0)
    .on("click", handleNodeClick)
    .attr("cx", (d) => d.x ?? 0)
    .attr("cy", (d) => d.y ?? 0);

  nodesEnter
    .transition()
    .duration(250)
    .attr("r", (d) => nodeSizes.get(d.id)!);

  const nodesUpdate = nodesEnter.merge(nodes);

  nodesUpdate.each(function (d) {
    const style = getNodeStyle(
      d,
      selectedNodes,
      nodeChanges,
      hoveredNode,
      nodeData,
      selectedCommunity,
    );
    const size = nodeSizes.get(d.id)!;
    d3.select(this)
      .on("click", (event) => handleNodeClick(event, d))
      .attr("fill", style.fill)
      .attr("stroke-width", style.strokeWidth)
      .style("stroke", style.stroke)
      .transition()
      .duration(150)
      .attr("r", size)
      .style("opacity", style.opacity);
  });
  nodesUpdate.call(createDrag(simulation));

  return nodesUpdate;
};

const updateLinks = (
  linkGroup: d3.Selection<d3.BaseType, unknown, null, undefined>,
  renderLinks: Edge[],
  selectedNodes: Set<string>,
  linkWeights: Map<string, number>,
  hoveredNode: string | null,
  edgeChanges: DataChanges,
  nodeSizes: Map<string, number>,
  nodeData: Map<string, FullData>,
) => {
  const links = linkGroup
    .selectAll<SVGLineElement, Edge>("line.link")
    .data(
      renderLinks,
      (d) => `${(d.source as Node).id}-${(d.target as Node).id}`,
    );

  links.exit().transition().duration(250).style("opacity", 0).remove();

  const linksEnter = links
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("x1", (d) => (d.source as Node).x ?? 0)
    .attr("y1", (d) => (d.source as Node).y ?? 0)
    .attr("x2", (d) => (d.source as Node).x ?? 0)
    .attr("y2", (d) => (d.source as Node).y ?? 0)
    .style("stroke-opacity", 0);

  const linksUpdate = linksEnter.merge(links);

  linksUpdate.each(function (d) {
    const sourceId = getNodeId(d.source);
    const targetId = getNodeId(d.target);
    const sourceRadius = nodeSizes.get(sourceId) ?? 15;
    const targetRadius = nodeSizes.get(targetId) ?? 15;

    const { x1, y1, x2, y2 } = calculateLinkEndpoints(
      d.source as Node,
      d.target as Node,
      sourceRadius,
      targetRadius,
    );

    d3.select(this).attr("x1", x1).attr("y1", y1).attr("x2", x2).attr("y2", y2);
  });

  linksUpdate.attr("stroke-width", (d) => {
    const sourceId = getNodeId(d.source);
    const targetId = getNodeId(d.target);
    const thickness = linkWeights.get(d.id) || 1.5;
    const isSelected =
      (selectedNodes.has(sourceId) && !nodeData.get(sourceId)?.stable) ||
      (selectedNodes.has(targetId) && !nodeData.get(targetId)?.stable);
    return isSelected ? thickness * 1.5 : thickness;
  });

  linksUpdate
    .transition()
    .duration(300)
    .ease(d3.easeCubicOut)
    .style("stroke-opacity", (d) => {
      const style = getLinkStyleForNode(
        d,
        selectedNodes,
        hoveredNode,
        edgeChanges,
        nodeData,
      );
      return style.strokeOpacity;
    })
    .style("stroke", (d) => {
      const style = getLinkStyleForNode(
        d,
        selectedNodes,
        hoveredNode,
        edgeChanges,
        nodeData,
      );
      return style.stroke;
    });

  return linksUpdate;
};

export const updateStyle = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
  nodeSizes: Map<string, number>,
  linkWeights: Map<string, number>,
  nodeChanges: DataChanges,
  edgeChanges: DataChanges,
  hoveredNode: string | null,
  nodeData: Map<string, FullData>,
  selectedCommunity: string,
) => {
  svg.selectAll<SVGCircleElement, Node>("circle.node").each(function (d) {
    const style = getNodeStyle(
      d,
      selectedNodes,
      nodeChanges,
      hoveredNode,
      nodeData,
      selectedCommunity,
    );
    const size = nodeSizes.get(d.id)!;
    d3.select(this)
      .attr("r", size)
      .attr("fill", style.fill)
      .style("stroke", style.stroke)
      .attr("stroke-width", style.strokeWidth)
      .style("opacity", style.opacity);
  });

  svg.selectAll<SVGLineElement, Edge>("line.link").each(function (d) {
    const style = getLinkStyleForNode(
      d,
      selectedNodes,
      hoveredNode,
      edgeChanges,
      nodeData,
    );
    const sourceId = getNodeId(d.source);
    const targetId = getNodeId(d.target);
    const thickness = linkWeights.get(d.id) || 1.5;
    const isSelected =
      (selectedNodes.has(sourceId) && !nodeData.get(sourceId)?.stable) ||
      (selectedNodes.has(targetId) && !nodeData.get(targetId)?.stable);

    const sourceRadius = nodeSizes.get(sourceId) ?? 15;
    const targetRadius = nodeSizes.get(targetId) ?? 15;
    const { x1, y1, x2, y2 } = calculateLinkEndpoints(
      d.source as Node,
      d.target as Node,
      sourceRadius,
      targetRadius,
    );

    d3.select(this)
      .attr("x1", x1)
      .attr("y1", y1)
      .attr("x2", x2)
      .attr("y2", y2)
      .style("stroke", style.stroke)
      .style("stroke-opacity", style.strokeOpacity)
      .attr("stroke-width", isSelected ? thickness * 1.5 : thickness);
  });
};

const updateGraph = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  simulation: d3.Simulation<Node, Edge>,
  network: Network,
  selectedNodes: Set<string>,
  nodeChanges: DataChanges,
  edgeChanges: DataChanges,
  nodeSizes: Map<string, number>,
  linkWeights: Map<string, number>,
  hoveredNode: string | null,
  nodeData: Map<string, FullData>,
  selectedCommunity: string,
) => {
  const svgGroup = svg.select("g.zoom-group");
  const linkGroup = svgGroup.select("g.links-group");
  const nodeGroup = svgGroup.select("g.nodes-group");

  const allLinks = updateLinks(
    linkGroup,
    network.edges,
    selectedNodes,
    linkWeights,
    hoveredNode,
    edgeChanges,
    nodeSizes,
    nodeData,
  );
  const allNodes = updateNodes(
    nodeGroup,
    network.nodes,
    simulation,
    selectedNodes,
    nodeSizes,
    nodeChanges,
    hoveredNode,
    nodeData,
    selectedCommunity,
  );

  simulation.on("tick", () => {
    allLinks.each(function (d) {
      const sourceId = getNodeId(d.source);
      const targetId = getNodeId(d.target);
      const sourceRadius = nodeSizes.get(sourceId) ?? 15;
      const targetRadius = nodeSizes.get(targetId) ?? 15;

      const { x1, y1, x2, y2 } = calculateLinkEndpoints(
        d.source as Node,
        d.target as Node,
        sourceRadius,
        targetRadius,
      );

      d3.select(this)
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2);
    });

    allNodes.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);

    updateLabelPositions(svg, nodeSizes);
  });
};

export default updateGraph;
