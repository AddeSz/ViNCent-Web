import type { SimulationLinkDatum, SimulationNodeDatum } from "d3-force";

export type NodeAttributeValue =
  | string
  | number
  | boolean
  | Record<string, any>;

export type NodeAttributes = Record<string, NodeAttributeValue>;
export type TimelineEntry = {
  timestep: number;
  attributes?: NodeAttributes;
};

export type AttributeInfo = {
  key: string;
  type: "string" | "number" | "boolean";
  values: Set<NodeAttributeValue>;
  isNominal: boolean;
  isOrdinal: boolean;
  isNumeric: boolean;
  isBoolean: boolean;
  range?: { min: number; max: number };
};

export type Node = SimulationNodeDatum & {
  id: string;
  label?: string;
  attributes?: NodeAttributes;
  history?: TimelineEntry[];
  linkCount?: number;
  removed?: boolean;
};

export type Link = SimulationLinkDatum<Node> & {
  source: string | Node;
  target: string | Node;
  weight?: number;
  directed?: boolean;
  attributes?: NodeAttributes;
};

export type Centrality = {
  id: string;
  [key: string]: string | number;
};

//This is more general than centrality, it includes pretty much anything
//used so I can see both node data and centrality data
export type FullData = Record<string, any> & {
  id: string;
  removed?: boolean;
  stable?: boolean;
};

export type Network = {
  nodes: Node[];
  links: Link[];
};

export type NodeChange = {
  added: Record<string, FullData>;
  removed: Record<string, FullData>;
  updated: Record<
    string,
    Record<string, { before: FullData; after: FullData }>
  >;
};
