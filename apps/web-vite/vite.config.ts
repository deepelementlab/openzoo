import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiUrl = env.VITE_API_URL || "http://localhost:8080";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@openzoo/core": path.resolve(__dirname, "../../packages/core/src"),
        "@openzoo/ui": path.resolve(__dirname, "../../packages/ui/src"),
        "@openzoo/views": path.resolve(__dirname, "../../packages/views/src"),
      },
    },
    server: {
      port: 3000,
      proxy: {
        "/rpc": apiUrl,
        "/health": apiUrl,
        "/auth": apiUrl,
        "/metrics": apiUrl,
      },
    },
  };
});
