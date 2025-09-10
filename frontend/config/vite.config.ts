import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, "../../"), "");
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "../src"),
      },
    },
    server: {
      port: parseInt(env.VITE_PORT),
    },
    define: {
      "import.meta.env": env, // <--- This ensures variables are available to the browser
    },
  };
});
