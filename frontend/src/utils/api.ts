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

  async processNetworkAsync(formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/process-network-async`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    // { task_id: string, status: string } for now
    return await response.json();
  },

  async getTaskResult(taskId: string) {
    const response = await fetch(`${API_BASE_URL}/task-result/${taskId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch task result: ${taskId}`);
    }
    // { task_id, status, result?, meta?, error? } for now
    return await response.json();
  },

  async processNetworkAsyncAndWait(
    formData: FormData,
    options?: {
      onProgress?: (status: Record<string, unknown>) => void;
      intervalMs?: number;
      stallTimeoutMs?: number;
    },
  ) {
    const intervalMs = options?.intervalMs ?? 1000;
    const stallTimeoutMs = options?.stallTimeoutMs ?? 2 * 60 * 1000;

    const { task_id } = await this.processNetworkAsync(formData);
    let lastProgressAt = Date.now();

    while (true) {
      const status = await this.getTaskResult(task_id);

      if (status.status === "PROGRESS" || status.status === "PROCESSING") {
        lastProgressAt = Date.now();
      }
      options?.onProgress?.(status);

      if (status.status === "SUCCESS") return status.result;
      if (status.status === "FAILURE") {
        throw new Error(
          (status.error as string) ?? "Network processing failed",
        );
      }
      if (Date.now() - lastProgressAt > stallTimeoutMs) {
        throw new Error(`Timed out waiting for task ${task_id} to complete`);
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  },
};

export default api;
