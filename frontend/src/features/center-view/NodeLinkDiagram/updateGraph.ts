import type { FullData, Link, Node } from "@/types/network";
import { handleHighlight, highlightLinksColor } from "@/utils/ColorHelper";
import { getNodeId } from "@/utils/utils";
import * as d3 from "d3";
import { createDrag } from "./setupSimulation";

const NODE_RADIUS = 10;
const LINK_STROKE_WIDTH = 1.5;

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

  linksEnter.transition().duration(300).style("stroke-opacity", 0.6);

  const linksUpdate = linksEnter.merge(links);

  linksUpdate
    .style("stroke", (d) => {
      const sourceRemoved = dataMap.get((d.source as Node).id)?.removed;
      const targetRemoved = dataMap.get((d.target as Node).id)?.removed;

      return sourceRemoved || targetRemoved
        ? "red"
        : selectedNodes.has(getNodeId(d.source)) ||
            selectedNodes.has(getNodeId(d.target))
          ? highlightLinksColor.selected
          : highlightLinksColor.default;
    })
    .style("stroke-opacity", (d) => {
      const sourceRemoved = dataMap.get((d.source as Node).id)?.removed;
      const targetRemoved = dataMap.get((d.target as Node).id)?.removed;
      return sourceRemoved || targetRemoved ? 0.4 : 0.6;
    });

  return linksUpdate;
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
    .attr("fill", (d) => (dataMap.get(d.id)?.removed ? "red" : "steelblue"))
    .attr("cx", (d) => d.x ?? 0)
    .attr("cy", (d) => d.y ?? 0);

  nodesEnter
    .transition()
    .duration(300)
    .attr("r", NODE_RADIUS)
    .style("opacity", 1);

  const nodesUpdate = nodesEnter.merge(nodes);

  nodesUpdate
    .attr("fill", (d) => (dataMap.get(d.id)?.removed ? "red" : "steelblue"))
    .on("click", handleNodeClick);
  nodesUpdate.call(createDrag(simulation));

  return nodesUpdate;
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
  const allNodes = updateNodes(nodeGroup, visibleNodes, simulation, dataMap);

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
