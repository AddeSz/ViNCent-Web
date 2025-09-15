import type { SimulationNodeDatum, SimulationLinkDatum } from "d3-force";

export type NodeAttributeValue = string | number | boolean;

export type NodeAttributes = Record<string, NodeAttributeValue>;

export type AttributeInfo = {
  key: string;
  type: "string" | "number" | "boolean";
  values: Set<NodeAttributeValue>;
};

export type Node = SimulationNodeDatum & {
  id: string;
  label?: string;
  attributes?: Record<string, any>;
  linkCount?: number;
};

export type Link = SimulationLinkDatum<Node> & {
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
  links: Link[];
};
