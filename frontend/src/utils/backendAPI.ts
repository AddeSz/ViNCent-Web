import { getProjectEnvVariables } from "@/shared/projectEnvVariables";
import type {
  AttributeRecord,
  Attributes,
  Network,
  TimelineEntry,
} from "@/types/network";
import { getNodeId } from "@/utils/utils";

const env = getProjectEnvVariables();
const API_BASE_URL = env.envVariables.VITE_BACKEND_URL;

interface BackendNetworkData {
  nodes: Array<{ id: string; [key: string]: any }>;
  links: Array<{ source: string; target: string; [key: string]: any }>;
}

interface PreprocessedNetworkResponse {
  network: Network;
  timesteps: number[];
  timelines: Record<string, TimelineEntry[]>;
  attributes: Record<string, Attributes>;
}

export const validateAndPreprocessNetwork = async (
  formData: FormData,
): Promise<PreprocessedNetworkResponse> => {
  const response = await fetch(`${API_BASE_URL}/validate-network`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.detail || `Validation failed! status: ${response.status}`,
    );
  }

  const data = await response.json();

  return {
    network: data.network,
    timesteps: data.timesteps || [],
    timelines: data.timelines || {},
    attributes: data.attributes || {},
  };
};

export const prepareNetworkForBackend = (
  network: Network,
): BackendNetworkData => ({
  nodes: network.nodes.map((node) => ({
    id: node.id,
    ...(node.label && { label: node.label }),
    ...(node.attributes && { attributes: node.attributes }),
  })),
  links: network.links.map((link) => ({
    source: getNodeId(link.source),
    target: getNodeId(link.target),
    ...(link.weight && { weight: link.weight }),
    ...(link.directed !== undefined && { directed: link.directed }),
    ...(link.attributes && { attributes: link.attributes }),
  })),
});

export const calculateCentralityValues = async (
  networkData: Network,
  datasetID?: string,
): Promise<{
  nodes: AttributeRecord[];
  edges: AttributeRecord[];
  nodeCentralityKeys: string[];
  edgeCentralityKeys: string[];
}> => {
  const backendData = prepareNetworkForBackend(networkData);

  const response = await fetch(`${API_BASE_URL}/calculate-centrality-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      network: backendData,
      ...(datasetID && { dataset_id: datasetID }),
    }),
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const data = await response.json();

  const nodes: AttributeRecord[] = Object.entries(data.nodes).map(
    ([id, attributes]) => ({ id, attributes: attributes as Attributes }),
  );

  const edges: AttributeRecord[] = Object.entries(data.edges).map(
    ([id, attributes]) => ({ id, attributes: attributes as Attributes }),
  );

  return {
    nodes,
    edges,
    nodeCentralityKeys: data.metadata?.calculated_node_centralities || [],
    edgeCentralityKeys: data.metadata?.calculated_edge_centralities || [],
  };
};

export const calculateCentralityValuesTimeline = async (
  networkData: Network,
  timesteps: number[],
  timelines: Map<string, TimelineEntry[]>,
  datasetID?: string,
): Promise<{
  nodes: Map<number, AttributeRecord[]>;
  edges: Map<number, AttributeRecord[]>;
  nodeCentralityKeys: Set<string>;
  edgeCentralityKeys: Set<string>;
}> => {
  const nodeResult = new Map<number, AttributeRecord[]>();
  const edgeResult = new Map<number, AttributeRecord[]>();
  const nodeCentralityKeys = new Set<string>();
  const edgeCentralityKeys = new Set<string>();

  for (const t of timesteps) {
    const filteredNodes = networkData.nodes.filter((node) => {
      const nodeTimeline = timelines.get(node.id);
      return nodeTimeline?.some((entry) => entry.timestep === t) ?? false;
    });

    if (filteredNodes.length === 0) continue;

    const filteredEdges = networkData.links.filter(
      (link) =>
        filteredNodes.some((n) => n.id === getNodeId(link.source)) &&
        filteredNodes.some((n) => n.id === getNodeId(link.target)),
    );

    const backendData = {
      nodes: filteredNodes.map((node) => ({
        id: node.id,
        ...(node.label && { label: node.label }),
        ...(node.attributes && { attributes: node.attributes }),
      })),
      links: filteredEdges.map((link) => ({
        source: getNodeId(link.source),
        target: getNodeId(link.target),
        ...(link.weight && { weight: link.weight }),
        ...(link.directed !== undefined && { directed: link.directed }),
        ...(link.attributes && { attributes: link.attributes }),
      })),
    };

    const response = await fetch(
      `${API_BASE_URL}/calculate-centrality-timestep`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timestep: t,
          network: backendData,
          ...(datasetID && { dataset_id: datasetID }),
        }),
      },
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();

    if (data.metadata?.calculated_node_centralities) {
      data.metadata.calculated_node_centralities.forEach((key: string) =>
        nodeCentralityKeys.add(key),
      );
    }
    if (data.metadata?.calculated_edge_centralities) {
      data.metadata.calculated_edge_centralities.forEach((key: string) =>
        edgeCentralityKeys.add(key),
      );
    }

    const nodes: AttributeRecord[] = data.nodes.map((nodeData: any) => {
      const { id, ...attributes } = nodeData;
      return { id, attributes };
    });

    const edges: AttributeRecord[] = Object.entries(data.edges).map(
      ([id, attributes]) => ({ id, attributes: attributes as Attributes }),
    );

    nodeResult.set(t, nodes);
    edgeResult.set(t, edges);
  }

  return {
    nodes: nodeResult,
    edges: edgeResult,
    nodeCentralityKeys,
    edgeCentralityKeys,
  };
};
