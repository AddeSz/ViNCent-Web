import type { SimulationLinkDatum, SimulationNodeDatum } from "d3-force";

export type AttributeValue = string | number | boolean;
export type Attributes = Record<string, AttributeValue>;

export interface AttributeInfo {
  key: string;
  type: "string" | "number" | "boolean";
  values: Set<AttributeValue>;
  isCategory: boolean;
  isCommunity: boolean;
  isNumeric: boolean;
  isCentrality: boolean;
  isBoolean: boolean;
  range: { min: number; max: number } | null;
}

export interface GraphElement {
  id: string;
  label?: string;
  attributes: Attributes;
}

export interface Node extends GraphElement {}

export interface Edge extends GraphElement {
  source: string;
  target: string;
  weight?: number;
}

export type Network = {
  nodes: Node[];
  edges: Edge[];
};

export interface ViewFlags {
  added: boolean;
  removed: boolean;
  pendingRemoval: boolean;
  hidden: boolean;
}

export interface ViewNode extends Node {
  flags: ViewFlags;
  neighbors: Set<string>;
  links: Set<string>;
}

export interface ViewEdge extends Edge {
  flags: ViewFlags;
}

export type ViewNetwork = {
  nodes: ViewNode[];
  edges: ViewEdge[];
};

export interface ForceNode extends SimulationNodeDatum {
  id: string;
  data: Node;
}

// NOTE: ForceEdge.source/target start as string ids (matching Edge.source/target)
// but are mutated in place by d3 into resolved ForceNode objects once the
// simulation initializes. Use getNodeId() or edge.data.source/target to safely read the id.
export interface ForceEdge extends SimulationLinkDatum<ForceNode> {
  id: string;
  data: Edge;
}

export interface GraphNode {
  id: string;
  color?: string;
  label?: string;
  importance?: number;
  size: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  color?: string;
  label?: string;
}

export type DataChanges = {
  added: Record<string, ViewNode | ViewEdge>;
  removed: Record<string, ViewNode | ViewEdge>;
  updated: Record<
    string,
    Record<string, { before: AttributeValue; after: AttributeValue }>
  >;
};

export type TimestepDelta = {
  nodes_added: Node[];
  nodes_removed: string[];
  nodes_attr_changed: Record<string, Attributes>;
  edges_added: Edge[];
  edges_removed: string[];
  edges_attr_changed: Record<string, Attributes>;
};

export interface CentralityData {
  nodes: Record<string, Record<string, number>>;
  edges: Record<string, Record<string, number>>;
}

export interface ProcessNetworkResponse {
  network: Network;
  base_state: Network;
  deltas: Record<number, TimestepDelta>;
  centralities: Record<number, CentralityData>;
  metrics_info: {
    nodes: Record<string, AttributeInfo>;
    edges: Record<string, AttributeInfo>;
  };
  communities: Record<number, Record<string, Record<string, number>>>;
  timesteps: number[];
  graph_type: "directed" | "undirected";
}
