import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@openzoo/core": path.resolve(__dirname, "../../packages/core/src"),
      "@openzoo/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@openzoo/views": path.resolve(__dirname, "../../packages/views/src"),
    },
  },
  server: {
    port: 5173,
  },
});
