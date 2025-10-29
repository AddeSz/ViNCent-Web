import type { Link, Node } from "@/types/network";
import type { DragBehavior, Selection, Simulation } from "d3";
import * as d3 from "d3";

interface SimulationSettings {
  linkDistance: number;
  chargeStrength: number;
  collisionEnabled: boolean;
  collisionRadiuses: Map<string, number>;
}

const createSimulation = (
  nodes: Node[],
  links: Link[],
  nodeSelection: Selection<SVGCircleElement, Node, SVGGElement, unknown>,
  linkSelection: Selection<SVGLineElement, Link, SVGGElement, unknown>,
  settings: SimulationSettings,
): Simulation<Node, Link> => {
  const simulation = d3
    .forceSimulation<Node, Link>(nodes)
    .force(
      "link",
      d3
        .forceLink<Node, Link>(links)
        .id((d) => d.id)
        .distance(settings.linkDistance),
    )
    .force("charge", d3.forceManyBody().strength(settings.chargeStrength))
    .force("center", d3.forceCenter(0, 0))
    .force("x", d3.forceX(0).strength(0.05))
    .force("y", d3.forceY(0).strength(0.05));

  if (settings.collisionEnabled) {
    simulation.force(
      "collision",
      d3.forceCollide<Node>().radius((d) => {
        const r = settings.collisionRadiuses?.get(d.id) ?? 1;
        return r + 1;
      }),
    );
  }

  simulation.on("tick", () => {
    linkSelection
      .attr("x1", (d) => (d.source as Node).x ?? 0)
      .attr("y1", (d) => (d.source as Node).y ?? 0)
      .attr("x2", (d) => (d.target as Node).x ?? 0)
      .attr("y2", (d) => (d.target as Node).y ?? 0);

    nodeSelection.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
    if (simulation.alpha() < 0.001) simulation.stop();
  });

  return simulation;
};

export function updateSimulationForces(
  simulation: Simulation<Node, Link>,
  settings: SimulationSettings,
): void {
  const linkForce = simulation.force("link") as d3.ForceLink<Node, Link>;
  if (linkForce) {
    linkForce.distance(settings.linkDistance);
  }

  const chargeForce = simulation.force("charge") as d3.ForceManyBody<Node>;
  if (chargeForce) {
    chargeForce.strength(settings.chargeStrength);
  }

  if (settings.collisionEnabled) {
    simulation.force(
      "collision",
      d3.forceCollide<Node>().radius((d) => {
        const r = settings.collisionRadiuses?.get(d.id) ?? 1;
        return r + 1;
      }),
    );
  } else {
    simulation.force("collision", null);
  }

  simulation.alpha(0.1).restart();
}

export function createDrag(
  simulation: Simulation<Node, Link>,
): DragBehavior<SVGCircleElement, Node, unknown> {
  return d3
    .drag<SVGCircleElement, Node>()
    .on("start", (event, d) => {
      if (
        event.sourceEvent &&
        (event.sourceEvent.shiftKey ||
          event.sourceEvent.ctrlKey ||
          event.sourceEvent.metaKey ||
          event.sourceEvent.button === 2)
      ) {
        return;
      }
      if (!event.active) simulation.alphaTarget(0.1).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", (event, d) => {
      if (d.fx !== undefined && d.fx !== null) {
        d.fx = event.x;
        d.fy = event.y;
      }
    })
    .on("end", (event, d) => {
      if (
        event.sourceEvent &&
        (event.sourceEvent.shiftKey ||
          event.sourceEvent.ctrlKey ||
          event.sourceEvent.metaKey ||
          event.sourceEvent.button === 2)
      ) {
        return;
      }
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
}

export default createSimulation;
