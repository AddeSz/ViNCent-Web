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

  async validateNetwork(formData: FormData) {
    const response = await fetch(`${API_BASE_URL}/validate-network`, {
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
