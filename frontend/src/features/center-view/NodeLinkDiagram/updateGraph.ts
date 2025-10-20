import type { FullData, Link, Node } from "@/types/network";
import {
  getLinkStyle,
  handleHighlight,
  highlightLinksColor,
} from "@/utils/ColorHelper";
import { getNodeId } from "@/utils/utils";
import * as d3 from "d3";
import { createDrag } from "./setupSimulation";

const LINK_STROKE_WIDTH = 1.5;
const OPACITY_VALUE = 0.6;

const getNodeStyle = (
  node: Node,
  dataMap: Map<string, FullData>,
  selectedNodes: Set<string>,
) => {
  const removed = dataMap.get(node.id)?.removed ?? true;
  return {
    fill: removed ? "#9c0202" : "steelblue",
    stroke: selectedNodes.has(node.id) ? highlightLinksColor.selected : "none",
    strokeWidth: selectedNodes.has(node.id) ? 2 : 0,
  };
};

const getLinkStyleForNode = (
  link: Link,
  dataMap: Map<string, FullData>,
  selectedNodes: Set<string>,
) => {
  const sourceId = getNodeId(link.source);
  const targetId = getNodeId(link.target);
  const sourceRemoved = dataMap.get(sourceId)?.removed;
  const targetRemoved = dataMap.get(targetId)?.removed;
  const isRemoved = (sourceRemoved ?? true) || (targetRemoved ?? true);
  const isSelected = selectedNodes.has(sourceId) || selectedNodes.has(targetId);
  const style = getLinkStyle(isRemoved, isSelected, OPACITY_VALUE, 0.7);

  return {
    stroke: style.stroke,
    strokeOpacity: style.opacity,
    strokeWidth: isSelected ? 2.5 : LINK_STROKE_WIDTH,
  };
};

const handleNodeClick = (event: MouseEvent, d: Node) => {
  const multi = event.shiftKey || event.ctrlKey || event.metaKey;
  handleHighlight(d.id, multi);
};

const updateNodes = (
  nodeGroup: d3.Selection<any, unknown, null, undefined>,
  visibleNodes: Node[],
  simulation: d3.Simulation<Node, Link>,
  dataMap: Map<string, FullData>,
  selectedNodes: Set<string>,
) => {
  const nodes = nodeGroup
    .selectAll<SVGCircleElement, Node>("circle.node")
    .data(visibleNodes, (d) => d.id);

  nodes
    .exit()
    .transition()
    .duration(300)
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

  nodesEnter.transition().duration(300).attr("r", 10).style("opacity", 1);

  const nodesUpdate = nodesEnter.merge(nodes);

  nodesUpdate.each(function (d) {
    const style = getNodeStyle(d, dataMap, selectedNodes);
    d3.select(this)
      .attr("fill", style.fill)
      .style("stroke", style.stroke)
      .attr("stroke-width", style.strokeWidth)
      .on("click", (event) => handleNodeClick(event, d));
  });
  nodesUpdate.call(createDrag(simulation));

  return nodesUpdate;
};

const updateLinks = (
  linkGroup: d3.Selection<any, unknown, null, undefined>,
  renderLinks: Link[],
  dataMap: Map<string, FullData>,
  selectedNodes: Set<string>,
) => {
  const links = linkGroup
    .selectAll<SVGLineElement, Link>("line.link")
    .data(
      renderLinks,
      (d) => `${(d.source as Node).id}-${(d.target as Node).id}`,
    );

  links.exit().transition().duration(300).style("opacity", 0).remove();

  const linksEnter = links
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("stroke-width", LINK_STROKE_WIDTH)
    .attr("x1", (d) => (d.source as Node).x ?? 0)
    .attr("y1", (d) => (d.source as Node).y ?? 0)
    .attr("x2", (d) => (d.target as Node).x ?? 0)
    .attr("y2", (d) => (d.target as Node).y ?? 0)
    .style("stroke-opacity", 0);

  linksEnter.transition().duration(300).style("stroke-opacity", OPACITY_VALUE);
  const linksUpdate = linksEnter.merge(links);
  linksUpdate.each(function (d) {
    const style = getLinkStyleForNode(d, dataMap, selectedNodes);
    d3.select(this)
      .style("stroke", style.stroke)
      .style("stroke-opacity", style.strokeOpacity)
      .attr("stroke-width", style.strokeWidth);
  });

  return linksUpdate;
};

export const updateStyle = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  selectedNodes: Set<string>,
  dataMap: Map<string, FullData>,
) => {
  svg.selectAll<SVGCircleElement, Node>("circle.node").each(function (d) {
    const style = getNodeStyle(d, dataMap, selectedNodes);
    d3.select(this)
      .attr("fill", style.fill)
      .style("stroke", style.stroke)
      .attr("stroke-width", style.strokeWidth);
  });

  svg.selectAll<SVGLineElement, Link>("line.link").each(function (d) {
    const style = getLinkStyleForNode(d, dataMap, selectedNodes);
    d3.select(this)
      .style("stroke", style.stroke)
      .style("stroke-opacity", style.strokeOpacity)
      .attr("stroke-width", style.strokeWidth);
  });
};

const updateGraph = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  simulation: d3.Simulation<Node, Link>,
  visibleNodes: Node[],
  visibleLinks: Link[],
  dataMap: Map<string, FullData>,
  selectedNodes: Set<string>,
) => {
  const svgGroup = svg.select("g.zoom-group");
  const linkGroup = svgGroup.select("g.links-group");
  const nodeGroup = svgGroup.select("g.nodes-group");

  const allLinks = updateLinks(linkGroup, visibleLinks, dataMap, selectedNodes);
  const allNodes = updateNodes(
    nodeGroup,
    visibleNodes,
    simulation,
    dataMap,
    selectedNodes,
  );

  simulation.on("tick", () => {
    allLinks
      .attr("x1", (d) => (d.source as Node).x ?? 0)
      .attr("y1", (d) => (d.source as Node).y ?? 0)
      .attr("x2", (d) => (d.target as Node).x ?? 0)
      .attr("y2", (d) => (d.target as Node).y ?? 0);

    allNodes.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
  });
};

export default updateGraph;
