import type { SimulationNodeDatum, SimulationLinkDatum } from "d3-force";

export type Node = SimulationNodeDatum & {
  id: string;
  label?: string;
  attributes?: Record<string, any>;
};

export type Edge = SimulationLinkDatum<Node> & {
  source: string | Node;
  target: string | Node;
  weight?: number;
  directed?: boolean;
  attributes?: Record<string, any>;
};

export type Centrality = {
  id: string;
  [key: string]: string | number;
};

export type Network = {
  nodes: Node[];
  edges: Edge[];
};
