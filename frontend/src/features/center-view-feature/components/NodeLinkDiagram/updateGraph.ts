import * as d3 from "d3";
import type { Node, Link } from "@/types/network";
import { createDrag } from "./setupSimulation";
import { handleHighlight, highlightLinksColor } from "@/utils/ColorHelper";

const NODE_RADIUS = 10;
const LINK_STROKE_WIDTH = 1.5;

const updateLinks = (
  linkGroup: d3.Selection<any, unknown, null, undefined>,
  renderLinks: Link[],
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
    .attr("stroke", highlightLinksColor.default)
    .attr("stroke-width", LINK_STROKE_WIDTH)
    .attr("x1", (d) => (d.source as Node).x ?? 0)
    .attr("y1", (d) => (d.source as Node).y ?? 0)
    .attr("x2", (d) => (d.target as Node).x ?? 0)
    .attr("y2", (d) => (d.target as Node).y ?? 0)
    .style("stroke-opacity", 0);

  linksEnter.transition().duration(400).style("stroke-opacity", 0.6);

  return linksEnter.merge(links);
};

const handleNodeClick = (event: MouseEvent, d: Node) => {
  const multi = event.shiftKey || event.ctrlKey || event.metaKey;
  handleHighlight(d.id, multi);
};

const updateNodes = (
  nodeGroup: d3.Selection<any, unknown, null, undefined>,
  visibleNodes: Node[],
  simulation: d3.Simulation<Node, Link>,
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
    .attr("fill", "steelblue")
    .attr("cx", (d) => d.x ?? 0)
    .attr("cy", (d) => d.y ?? 0)
    .style("cursor", "pointer")
    .style("opacity", 0)
    .on("click", handleNodeClick);

  nodesEnter
    .transition()
    .duration(300)
    .attr("r", NODE_RADIUS)
    .style("opacity", 1);

  const allNodes = nodesEnter.merge(nodes);
  allNodes.call(createDrag(simulation));

  return allNodes;
};

export const updateGraph = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  simulation: d3.Simulation<Node, Link>,
  visibleNodes: Node[],
  visibleLinks: Link[],
) => {
  const svgGroup = svg.select("g.zoom-group");
  const linkGroup = svgGroup.select("g.links-group");
  const nodeGroup = svgGroup.select("g.nodes-group");

  const allLinks = updateLinks(linkGroup, visibleLinks);
  const allNodes = updateNodes(nodeGroup, visibleNodes, simulation);

  simulation.on("tick", () => {
    allLinks
      .attr("x1", (d) => (d.source as Node).x ?? 0)
      .attr("y1", (d) => (d.source as Node).y ?? 0)
      .attr("x2", (d) => (d.target as Node).x ?? 0)
      .attr("y2", (d) => (d.target as Node).y ?? 0);

    allNodes.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
  });
};
