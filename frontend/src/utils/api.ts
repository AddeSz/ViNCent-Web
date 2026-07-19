import { getProjectEnvVariables } from "@/shared/projectEnvVariables";
import type { ProcessNetworkResponse } from "@/types";

const env = getProjectEnvVariables();
const API_BASE_URL = env.envVariables.VITE_BACKEND_URL;

interface TaskProgress {
  stage: "parsing" | "calculating" | null;
  metric: string | null;
  metric_index: number | null;
  metric_total: number | null;
  timestep_index: number | null;
  timestep_total: number | null;
}

export interface TaskStatus {
  task_id: string;
  status: "PENDING" | "PROGRESS" | "SUCCESS" | "FAILURE";
  queue?: {
    position: number | null;
    length: number;
  };
  progress?: TaskProgress;
  error?: {
    type: string;
    message: string;
  };
  result?: ProcessNetworkResponse;
}

export interface OptionMeta {
  name: string;
  category: string;
  requirement: string | null;
  performance: string | null;
  description: string | null;
}

interface OptionsResponse {
  centralities: OptionMeta[];
  communities: OptionMeta[];
  datasets: string[];
}

export interface OptionsData {
  categories: Record<string, OptionMeta[]>;
  allOptionNames: string[];
  communityKeys: Set<string>;
}

export function mergeOptionsData(options: OptionsResponse): OptionsData {
  const combined = [...options.centralities, ...options.communities];

  const categories: Record<string, OptionMeta[]> = {};
  for (const option of combined) {
    (categories[option.category] ??= []).push(option);
  }

  const allOptionNames = combined.map((option) => option.name);

  return {
    categories,
    allOptionNames,
    communityKeys: new Set(options.communities.map((option) => option.name)),
  };
}

export const api = {
  baseUrl: API_BASE_URL,

  async fetchOptions(): Promise<OptionsResponse> {
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

  async submitAsyncProcess(formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/process-network-async`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    return (await response.json()) as { task_id: string; status: string };
  },

  async getProcessingTask(taskId: string): Promise<TaskStatus> {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch network processing task: ${taskId}`);
    }
    return await response.json();
  },

  async processNetworkAsync(
    formData: FormData,
    onProgress?: (status: TaskStatus) => void,
  ) {
    const POLL_INTERVAL_MS = 2000;
    const STALL_TIMEOUT_MS = 2 * 60 * 1000;

    const { task_id } = await this.submitAsyncProcess(formData);
    let lastProgressAt = Date.now();

    let lastStatus: TaskStatus = await this.getProcessingTask(task_id);
    onProgress?.(lastStatus);
    if (lastStatus.status === "SUCCESS") return lastStatus.result;
    if (lastStatus.status === "FAILURE") {
      throw new Error(lastStatus.error?.message ?? "Network processing failed");
    }

    while (true) {
      const nextIntervalMs = POLL_INTERVAL_MS;
      await new Promise((resolve) => setTimeout(resolve, nextIntervalMs));

      const status = await this.getProcessingTask(task_id);

      if (
        status.status === "PROGRESS" ||
        (status.status === "PENDING" && status.queue?.position != null)
      ) {
        lastProgressAt = Date.now();
      }

      onProgress?.(status);

      if (status.status === "SUCCESS") return status.result;
      if (status.status === "FAILURE") {
        throw new Error(status.error?.message ?? "Network processing failed");
      }
      if (Date.now() - lastProgressAt > STALL_TIMEOUT_MS) {
        throw new Error(`Timed out waiting for task ${task_id} to complete`);
      }

      lastStatus = status;
    }
  },
};

export default api;
