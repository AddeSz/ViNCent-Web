import { getProjectEnvVariables } from "@/shared/projectEnvVariables";

const env = getProjectEnvVariables();
const API_BASE_URL = env.envVariables.VITE_BACKEND_URL;

export const api = {
  baseUrl: API_BASE_URL,

  async fetchOptions() {
    const response = await fetch(`${API_BASE_URL}/get-options`);
    if (!response.ok) {
      throw new Error("Failed to fetch options");
    }
    return response.json();
  },

  async getDataset(
    datasetId: string,
    centralities?: string[],
    communities?: string[],
  ) {
    const params = new URLSearchParams();
    if (centralities && centralities.length > 0) {
      params.append("centralities", centralities.join(","));
    }
    if (communities && communities.length > 0) {
      params.append("communities", communities.join(","));
    }

    const url = `${API_BASE_URL}/dataset/${datasetId}${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${datasetId}`);
    }
    return response.json();
  },

  async processNetwork(formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/process-network`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
  },
};

export default api;
