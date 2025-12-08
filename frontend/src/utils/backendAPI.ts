import { getProjectEnvVariables } from "@/shared/projectEnvVariables";
import type {
  AttributeInfo,
  CentralityData,
  Network,
  TimestepDelta,
} from "@/types/network";

const env = getProjectEnvVariables();
const API_BASE_URL = env.envVariables.VITE_BACKEND_URL;

export interface NetworkResponse {
  network: Network;
  base_state: Network;
  deltas: Record<number, TimestepDelta>;
  centralities: Record<number, CentralityData>;
  metrics_info: {
    nodes: Record<string, AttributeInfo>;
    edges: Record<string, AttributeInfo>;
  };
}

export const validateAndPreprocessNetwork = async (
  formData: FormData,
): Promise<NetworkResponse> => {
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
    base_state: data.base_state,
    deltas: data.deltas,
    centralities: data.centralities,
    metrics_info: data.metrics_info,
  };
};
