import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const projectRoot = path.resolve(__dirname, "../../");
  const localEnv = loadEnv(mode, process.cwd(), "VITE_");
  const rootEnv = loadEnv(mode, projectRoot, "VITE_");
  const env = { ...process.env, ...localEnv, ...rootEnv } as Record<
    string,
    string
  >;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "../src"),
      },
    },
    server: {
      port: parseInt(env.VITE_PORT || "3000"),
      host: "0.0.0.0",
      watch: {
        usePolling: true,
      },
    },
    define: {
      "import.meta.env.VITE_BACKEND_URL": JSON.stringify(env.VITE_BACKEND_URL),
    },
    build: {
      sourcemap: env.VITE_GENERATE_SOURCEMAP === "true",
      rollupOptions: {
        output: {
          format: "es",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          manualChunks(id: any) {
            if (/projectEnvVariables/.test(id)) {
              return "projectEnvVariables";
            }
          },
        },
      },
    },
  };
});
