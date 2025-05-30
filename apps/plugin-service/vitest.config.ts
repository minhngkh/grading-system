import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    watch: false,
    globals: true,
    environment: "node",
    testTimeout: 0,
    env: {
      // LOG_LEVEL: "info",
    }
  },
  plugins: [tsconfigPaths()],
});
