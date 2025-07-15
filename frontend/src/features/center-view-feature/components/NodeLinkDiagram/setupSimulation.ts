// utils/setupSimulation.ts
import * as d3 from "d3";
import type { Simulation, Selection, DragBehavior } from "d3";
import type { Node, Edge } from "@/types/network";

export function createSimulation(
  nodes: Node[],
  edges: Edge[],
  nodeSelection: Selection<SVGCircleElement, Node, SVGGElement, unknown>,
  linkSelection: Selection<SVGLineElement, Edge, SVGGElement, unknown>,
): Simulation<Node, Edge> {
  const simulation = d3
    .forceSimulation<Node, Edge>(nodes)
    .force(
      "link",
      d3
        .forceLink<Node, Edge>(edges)
        .id((d) => d.id)
        .distance(100),
    )
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(0, 0))
    .on("tick", () => {
      linkSelection
        .attr("x1", (d) => (d.source as Node).x!)
        .attr("y1", (d) => (d.source as Node).y!)
        .attr("x2", (d) => (d.target as Node).x!)
        .attr("y2", (d) => (d.target as Node).y!);

      nodeSelection.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
    });

  return simulation;
}

export function createDrag(
  simulation: Simulation<Node, Edge>,
): DragBehavior<SVGCircleElement, Node, unknown> {
  return d3
    .drag<SVGCircleElement, Node>()
    .on("start", (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on("end", (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
}
