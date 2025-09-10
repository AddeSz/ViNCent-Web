import * as d3 from "d3";
import type { Node, Edge } from "@/types/network";
import { createDrag } from "./setupSimulation";
import { handleHighlight, highlightLinksColor } from "@/utils/ColorHelper";

export const updateGraph = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  simulation: d3.Simulation<Node, Edge>,
  nodesData: Node[],
  edgesData: Edge[],
) => {
  const svgGroup = svg.select("g.zoom-group");
  const linkGroup = svgGroup.select("g.links-group");
  const nodeGroup = svgGroup.select("g.nodes-group");

  const links = linkGroup
    .selectAll<SVGLineElement, Edge>("line.link")
    .data(edgesData, (d) => `${(d as Edge).source}-${(d as Edge).target}`);
  links.exit().remove();
  const newLinks = links
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("stroke", highlightLinksColor.default)
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", 1.5);
  const allLinks = newLinks.merge(links as any);

  const nodes = nodeGroup
    .selectAll<SVGCircleElement, Node>("circle.node")
    .data(nodesData, (d) => d.id);
  nodes.exit().remove();
  const newNodes = nodes
    .enter()
    .append("circle")
    .attr("class", "node")
    .attr("r", 10)
    .attr("fill", "steelblue")
    .style("cursor", "pointer")
    .on("click", (event, d) => {
      const multi = event.shiftKey || event.ctrlKey || event.metaKey;
      handleHighlight(d.id, multi);
    });
  const allNodes = newNodes.merge(nodes as any);

  allNodes.call(createDrag(simulation));

  simulation.nodes(nodesData);
  const linkForce = simulation.force("link") as d3.ForceLink<Node, Edge>;
  if (linkForce) linkForce.links(edgesData);

  simulation.on("tick", () => {
    allLinks
      .attr("x1", (d) => (d.source as any).x)
      .attr("y1", (d) => (d.source as any).y)
      .attr("x2", (d) => (d.target as any).x)
      .attr("y2", (d) => (d.target as any).y);

    allNodes.attr("cx", (d) => (d as any).x).attr("cy", (d) => (d as any).y);
  });

  simulation.alpha(0.3).restart();
};
