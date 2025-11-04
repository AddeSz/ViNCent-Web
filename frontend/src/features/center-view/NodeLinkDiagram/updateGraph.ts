import { useSettingsStore } from "@/stores/useSettingsStore";
import type {
  FullData,
  Link,
  Network,
  Node,
  NodeChange,
} from "@/types/network";
import {
  getLinkStyle,
  handleHighlight,
  highlightNodeColor,
} from "@/utils/ColorHelper";
import { getNodeId } from "@/utils/utils";
import * as d3 from "d3";
import { getNodeLabel } from "./nodeLinkUtils";
import { createDrag } from "./setupSimulation";

const OPACITY_VALUE = 0.6;

const getNodeStyle = (
  node: Node,
  selectedNodes: Set<string>,
  changes: NodeChange,
  hoveredNode: FullData | null,
) => {
  const { displaySettings } = useSettingsStore.getState();
  const removed = changes.removed[node.id] ? true : false;
  const added = changes.added[node.id] ? true : false;

  let fill = "steelblue";
  if (added) fill = "green";
  else if (removed && displaySettings.keepPreviewNodes)
    fill = highlightNodeColor.removed;

  const isSelected = selectedNodes.has(node.id);
  const isHovered = hoveredNode?.id === node.id;

  let stroke = "none";
  let strokeWidth = 0;

  if (isSelected) {
    stroke = highlightNodeColor.selectedOutline;
    strokeWidth = 2;
  } else if (isHovered) {
    stroke = highlightNodeColor.hoveredOutline;
    strokeWidth = 2;
  }

  return {
    fill,
    stroke,
    strokeWidth,
  };
};

const getLinkStyleForNode = (
  link: Link,
  dataMap: Map<string, FullData>,
  selectedNodes: Set<string>,
  hoveredNode: FullData | null,
) => {
  const sourceId = getNodeId(link.source);
  const targetId = getNodeId(link.target);
  const sourceRemoved = dataMap.get(sourceId)?.removed;
  const targetRemoved = dataMap.get(targetId)?.removed;
  const isRemoved = (sourceRemoved ?? false) || (targetRemoved ?? false);
  const isSelected = selectedNodes.has(sourceId) || selectedNodes.has(targetId);
  const isHovered = !!(
    hoveredNode &&
    sourceId &&
    targetId &&
    (sourceId === hoveredNode.id || targetId === hoveredNode.id)
  );
  const style = getLinkStyle(
    isRemoved,
    isSelected,
    isHovered,
    OPACITY_VALUE,
    0.8,
  );

  return {
    stroke: style.stroke,
    strokeOpacity: style.opacity,
  };
};

const handleNodeClick = (event: MouseEvent, d: Node) => {
  const multi = event.shiftKey || event.ctrlKey || event.metaKey;
  handleHighlight(d.id, multi);
};

const updateNodes = (
  nodeGroup: d3.Selection<d3.BaseType, unknown, null, undefined>,
  visibleNodes: Node[],
  simulation: d3.Simulation<Node, Link>,
  selectedNodes: Set<string>,
  nodeSizes: Map<string, number>,
  lastChanges: NodeChange,
  hoveredNode: FullData | null,
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
    .attr("r", (d) => nodeSizes.get(d.id)!)
    .style("opacity", 1);

  const nodesUpdate = nodesEnter.merge(nodes);

  nodesUpdate.each(function (d) {
    const style = getNodeStyle(d, selectedNodes, lastChanges, hoveredNode);
    const size = nodeSizes.get(d.id)!;

    d3.select(this)
      .on("click", (event) => handleNodeClick(event, d))
      .attr("fill", style.fill)
      .attr("stroke-width", style.strokeWidth)
      .style("stroke", style.stroke)
      .transition()
      .duration(150)
      .attr("r", size)
      .style("opacity", 1);
  });
  nodesUpdate.call(createDrag(simulation));

  return nodesUpdate;
};

const updateLabels = (
  nodeGroup: d3.Selection<d3.BaseType, unknown, null, undefined>,
  visibleNodes: Node[],
  showLabels: boolean,
  nodeSizes: Map<string, number>,
) => {
  if (!showLabels) {
    nodeGroup.selectAll("text.node-label").remove();
    return;
  }

  const labels = nodeGroup
    .selectAll<SVGTextElement, Node>("text.node-label")
    .data(visibleNodes, (d) => d.id);

  labels.exit().remove();

  const labelsEnter = labels
    .enter()
    .append("text")
    .attr("class", "node-label")
    .attr("text-anchor", "middle")
    .attr("dy", (d) => -(nodeSizes.get(d.id) ?? 15) - 2)
    .attr("font-size", "10px")
    .attr("fill", "currentColor")
    .attr("pointer-events", "none")
    .style("user-select", "none")
    .text((d) => getNodeLabel(d));

  const labelsUpdate = labelsEnter.merge(labels);

  labelsUpdate
    .attr("x", (d) => Math.round(d.x ?? 0))
    .attr("y", (d) => Math.round(d.y ?? 0))
    .attr("dy", (d) => -(nodeSizes.get(d.id) ?? 15) - 2)
    .text((d) => getNodeLabel(d));

  return labelsUpdate;
};

const updateLinks = (
  linkGroup: d3.Selection<d3.BaseType, unknown, null, undefined>,
  renderLinks: Link[],
  dataMap: Map<string, FullData>,
  selectedNodes: Set<string>,
  linkWeights: Map<string, number>,
  hoveredNode: FullData | null,
) => {
  const links = linkGroup
    .selectAll<SVGLineElement, Link>("line.link")
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

  linksUpdate
    .attr("x1", (d) => (d.source as Node).x ?? 0)
    .attr("y1", (d) => (d.source as Node).y ?? 0)
    .attr("x2", (d) => (d.target as Node).x ?? 0)
    .attr("y2", (d) => (d.target as Node).y ?? 0)
    .attr("stroke-width", (d) => {
      const sourceId = getNodeId(d.source);
      const targetId = getNodeId(d.target);
      const linkId = `${sourceId}-${targetId}`;
      const thickness = linkWeights.get(linkId) || 1.5;
      const isSelected =
        selectedNodes.has(sourceId) || selectedNodes.has(targetId);
      return isSelected ? thickness * 1.5 : thickness;
    });

  linksUpdate
    .transition()
    .duration(300)
    .ease(d3.easeCubicOut)
    .style("stroke-opacity", (d) => {
      const style = getLinkStyleForNode(d, dataMap, selectedNodes, hoveredNode);
      return style.strokeOpacity;
    })
    .style("stroke", (d) => {
      const style = getLinkStyleForNode(d, dataMap, selectedNodes, hoveredNode);
      return style.stroke;
    });

  return linksUpdate;
};

export const updateStyle = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
  dataMap: Map<string, FullData>,
  nodeSizes: Map<string, number>,
  linkWeights: Map<string, number>,
  lastChanges: NodeChange,
  hoveredNode: FullData | null,
) => {
  svg.selectAll<SVGCircleElement, Node>("circle.node").each(function (d) {
    const style = getNodeStyle(d, selectedNodes, lastChanges, hoveredNode);
    const size = nodeSizes.get(d.id)!;
    d3.select(this)
      .attr("r", size)
      .attr("fill", style.fill)
      .style("stroke", style.stroke)
      .attr("stroke-width", style.strokeWidth);
  });

  svg.selectAll<SVGLineElement, Link>("line.link").each(function (d) {
    const style = getLinkStyleForNode(d, dataMap, selectedNodes, hoveredNode);
    const sourceId = getNodeId(d.source);
    const targetId = getNodeId(d.target);
    const linkId = `${sourceId}-${targetId}`;
    const thickness = linkWeights.get(linkId) || 1.5;
    const isSelected =
      selectedNodes.has(sourceId) || selectedNodes.has(targetId);

    d3.select(this)
      .style("stroke", style.stroke)
      .style("stroke-opacity", style.strokeOpacity)
      .attr("stroke-width", isSelected ? thickness * 1.5 : thickness);
  });
};

const updateGraph = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  simulation: d3.Simulation<Node, Link>,
  network: Network,
  dataMap: Map<string, FullData>,
  selectedNodes: Set<string>,
  lastChanges: NodeChange,
  nodeSizes: Map<string, number>,
  linkWeights: Map<string, number>,
  hoveredNode: FullData | null,
  showLabels: boolean,
) => {
  const svgGroup = svg.select("g.zoom-group");
  const linkGroup = svgGroup.select("g.links-group");
  const nodeGroup = svgGroup.select("g.nodes-group");

  const allLinks = updateLinks(
    linkGroup,
    network.links,
    dataMap,
    selectedNodes,
    linkWeights,
    hoveredNode,
  );
  const allNodes = updateNodes(
    nodeGroup,
    network.nodes,
    simulation,
    selectedNodes,
    nodeSizes,
    lastChanges,
    hoveredNode,
  );
  const allLabels = updateLabels(
    nodeGroup,
    network.nodes,
    showLabels,
    nodeSizes,
  );

  simulation.on("tick", () => {
    allLinks
      .attr("x1", (d) => (d.source as Node).x ?? 0)
      .attr("y1", (d) => (d.source as Node).y ?? 0)
      .attr("x2", (d) => (d.target as Node).x ?? 0)
      .attr("y2", (d) => (d.target as Node).y ?? 0);

    allNodes.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);

    if (showLabels && allLabels) {
      allLabels.attr("x", (d) => d.x ?? 0).attr("y", (d) => d.y ?? 0);
    }
  });
};

export default updateGraph;
