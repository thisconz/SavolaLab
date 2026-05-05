import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import viteCompression from "vite-plugin-compression";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isProduction = mode === "production";

  return {
    plugins: [
      react({
        babel: {
          plugins: [
            ["@babel/plugin-proposal-decorators", { legacy: true }],
            ["@babel/plugin-proposal-class-properties", { loose: true }],
          ],
        },
      }),
      tailwindcss(),
      viteCompression({ algorithm: "brotliCompress", ext: ".br" }),
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@server": path.resolve(__dirname, "./server"),
        "@zenthar/core": path.resolve(__dirname, "./src/core"),
      },
    },

    build: {
      target: "esnext",
      outDir: "dist",
      // FIX: sourcemaps only in non-production (was inverse)
      sourcemap: !isProduction,
      minify: "esbuild",
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "framer-motion"],
            "vendor-charts": ["recharts"],
            "vendor-state": ["zustand", "xstate"],
            "vendor-utils": ["lucide-react", "clsx", "tailwind-merge", "sonner"],
          },
        },
      },
      // Warn when any chunk exceeds 600 kB
      chunkSizeWarningLimit: 600,
    },

    server: {
      host: true,
      port: 5173,
      strictPort: true,
      // FIX: HMR enabled in dev (was false, breaking live reload)
      hmr: true,
      proxy: {
        "/api": {
          // FIX: removed erroneous `rewrite` that stripped "/api" prefix,
          // causing all proxied requests to 404 on the Hono server.
          // The server mounts routes at /api/*, so no rewrite is needed.
          target: env.VITE_API_URL || "http://localhost:3000",
          changeOrigin: true,
          secure: false,
        },
      },
    },

    optimizeDeps: {
      include: ["react", "react-dom", "framer-motion", "lucide-react", "recharts"],
    },

    // Expose only VITE_ prefixed env vars to the client (Vite default)
    // Explicit safeguard: never expose secrets
    envPrefix: "VITE_",
  };
});