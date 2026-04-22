import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // Isolate each test file to prevent global state leaks
    isolate: true,

    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx}", "server/**/*.ts"],
      exclude: [
        "src/lib/**", // thin re-exports only
        "src/main.tsx", // bootstrap — no logic to test
        "**/*.d.ts",
        "**/node_modules/**",
        "**/*.config.*",
        "src/core/types/**", // type-only files
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
