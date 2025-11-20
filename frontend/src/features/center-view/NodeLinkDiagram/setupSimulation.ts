import type { Link, Node } from "@/types/network";
import type { DragBehavior, Simulation } from "d3";
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
  return simulation;
};

export function updateSimulationForces(
  simulation: Simulation<Node, Link>,
  linkDistance: number,
  chargeStrength: number,
): void {
  const linkForce = simulation.force("link") as d3.ForceLink<Node, Link>;
  if (linkForce) {
    linkForce.distance(linkDistance);
  }

  const chargeForce = simulation.force("charge") as d3.ForceManyBody<Node>;
  if (chargeForce) {
    chargeForce.strength(chargeStrength);
  }

  simulation.alpha(0.1).restart();
}

export function updateCollisionRadiuses(
  simulation: Simulation<Node, Link>,
  collisionRadiuses: Map<string, number>,
  collisionEnabled: boolean,
): void {
  if (collisionEnabled) {
    simulation.force(
      "collision",
      d3
        .forceCollide<Node>()
        .radius((d) => {
          const r = collisionRadiuses?.get(d.id) ?? 1;
          return r + 1;
        })
        .iterations(3),
    );
  } else {
    simulation.force("collision", null);
  }

  if (collisionEnabled) simulation.alpha(0.01).alphaTarget(0).restart();
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
      if (!event.active) simulation.alphaTarget(0.2).restart();
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
