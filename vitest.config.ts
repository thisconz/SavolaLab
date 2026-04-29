import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    isolate: true,

    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx}", "server/**/*.ts"],
      exclude: [
        "src/lib/**",
        "src/main.tsx",
        "**/*.d.ts",
        "**/node_modules/**",
        "**/*.config.*",
        "src/core/types/**",
        "**/tests/e2e/**",
        "**/*.spec.ts",
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
