import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    env: {},
    coverage: {
      reporter: "v8" as const,
      reportsDirectory: "./test-output/vitest/coverage",
    },
  },
  plugins: [tsconfigPaths()],
});
