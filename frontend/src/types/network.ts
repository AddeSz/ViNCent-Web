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
  isCategory: boolean;
  isCommunity: boolean;
  isNumeric: boolean;
  isCentrality: boolean;
  isBoolean: boolean;
  range?: { min: number; max: number };
};

export type Node = SimulationNodeDatum & {
  id: string;
  label?: string;
  attributes?: Attributes;
};

export type Edge = SimulationLinkDatum<Node> & {
  id: string;
  source: string | Node;
  target: string | Node;
  weight?: number;
  attributes?: Attributes;
};

export type FullData = Record<string, any> & {
  id: string;
  pendingRemoval?: boolean;
  removed?: boolean;
  hidden?: boolean;
  linked?: Set<string>;
};

export type Network = {
  nodes: Node[];
  edges: Edge[];
};

export type DataChanges = {
  added: Record<string, FullData>;
  removed: Record<string, FullData>;
  updated: Record<
    string,
    Record<string, { before: FullData; after: FullData }>
  >;
};

export interface CentralityData {
  nodes: Record<string, Record<string, number>>;
  edges: Record<string, Record<string, number>>;
}

export type TimestepDelta = {
  nodes_added: Node[];
  nodes_removed: string[];
  nodes_attr_changed: Record<string, Attributes>;
  edges_added: Edge[];
  edges_removed: string[];
  edges_attr_changed: Record<string, Attributes>;
};
