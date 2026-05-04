import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isProduction = mode === "production";

  return {
    // 1. Plugin Suite: Adds compression and bundle analysis
    plugins: [
      react({
        // Babel optimization for fast refreshes and decorator support
        babel: {
          plugins: [
            ["@babel/plugin-proposal-decorators", { legacy: true }],
            ["@babel/plugin-proposal-class-properties", { loose: true }],
          ],
        },
      }),
      tailwindcss(),
      // Generates Gzip/Brotli files for the Zenthar Kernel deployment
      viteCompression({ algorithm: "brotliCompress", ext: ".br" }),
      // Generates stats.html in your root to analyze bundle weight
      visualizer({
        filename: "./dist/stats.html",
        open: false,
        gzipSize: true,
      }),
    ],

    // 2. Resolve Logic: Synced with your enhanced tsconfig paths
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@server": path.resolve(__dirname, "./server"),
        "@zenthar/core": path.resolve(__dirname, "./src/core"),
      },
    },

    // 3. Optimized Build Strategy
    build: {
      target: "esnext", // Leverages modern browser capabilities
      outDir: "dist",
      sourcemap: mode !== "production",
      minify: "esbuild",
      rollupOptions: {
        output: {
          // Chunking Strategy: Separates UI library from Logic
          manualChunks: {
            "vendor-react": ["react", "react-dom", "framer-motion"],
            "vendor-utils": ["lucide-react", "clsx", "tailwind-merge"],
          },
        },
      },
    },

    // 4. Hardened Server Configuration
    server: {
      host: true, // Listen on all addresses for local network testing
      port: 5173,
      strictPort: true, // Fails if port is taken instead of picking next
      // HMR is locked for stability during agent-led development
      hmr: false,
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:3000",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },

    // 5. Performance Optimization
    optimizeDeps: {
      // Pre-bundles these to prevent waterfall loads on first boot
      include: ["react", "react-dom", "framer-motion", "lucide-react"],
    },
  };
});
