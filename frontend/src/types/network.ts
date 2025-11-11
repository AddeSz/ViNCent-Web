import type { SimulationLinkDatum, SimulationNodeDatum } from "d3-force";

export type AttributeValue = string | number | boolean | Record<string, any>;
export type Attributes = Record<string, AttributeValue>;
export type AttributeRecord = {
  id: string;
  attributes: Attributes;
};
export type AttributeInfo = {
  key: string;
  type: "string" | "number" | "boolean";
  values: Set<AttributeValue>;
  isNominal: boolean;
  isOrdinal: boolean;
  isNumeric: boolean;
  isBoolean: boolean;
  isCentrality?: boolean;
  range?: { min: number; max: number };
};

export type TimelineEntry = {
  timestep: number;
  attributes?: Attributes;
};

export type Node = SimulationNodeDatum & {
  id: string;
  label?: string;
  attributes?: Attributes;
  history?: TimelineEntry[];
  linkCount?: number;
  removed?: boolean;
};

export type Link = SimulationLinkDatum<Node> & {
  source: string | Node;
  target: string | Node;
  weight?: number;
  directed?: boolean;
  attributes?: Attributes;
};

//This is more general than centrality, it includes pretty much anything
//used so I can see both node data and centrality data
export type FullData = Record<string, any> & {
  id: string;
  removed?: boolean;
  stable?: boolean;
  linked?: Set<string>;
};

export type Network = {
  nodes: Node[];
  links: Link[];
};

export type DataChanges = {
  added: Record<string, FullData>;
  removed: Record<string, FullData>;
  updated: Record<
    string,
    Record<string, { before: FullData; after: FullData }>
  >;
};
