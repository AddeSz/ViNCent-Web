import type { Network, Centrality } from "@/types/network";
import { getNodeId } from "@/utils/utils";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

interface BackendNetworkData {
  nodes: Array<{ id: string; [key: string]: any }>;
  links: Array<{ source: string; target: string; [key: string]: any }>;
}

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
  centralities?: string[],
): Promise<Centrality[]> => {
  const backendData = {
    network: prepareNetworkForBackend(networkData),
    ...(centralities ? { centralities } : {}),
  };

  const response = await fetch(`${API_BASE_URL}/calculate-centrality-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(backendData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const backendCentralityData = await response.json();

  return Object.entries(
    backendCentralityData as Record<string, Record<string, string | number>>,
  ).map(([nodeId, centralities]) => ({
    id: nodeId,
    ...centralities,
  }));
};
