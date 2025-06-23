import path from "node:path";
import process from "node:process";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis",
  },
  server: {
    ...(process.env.PORT
      ? {
          port: Number(process.env.PORT),
          strictPort: true,
        }
      : {}),
    proxy: {
      "/azure": {
        target: "http://127.0.0.1:61899/devstoreaccount1/submissions-store",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/azure/, ""),
      },
    },
  },
});
