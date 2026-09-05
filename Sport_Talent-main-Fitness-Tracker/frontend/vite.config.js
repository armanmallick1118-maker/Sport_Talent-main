import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  // Dev server proxy — eliminates CORS issues in local development
  server: {
    port: 5173,
    proxy: {
      // All /api/* requests → Express backend
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      // All /ml/* requests → FastAPI MediaPipeline
      "/ml": {
        target: "http://localhost:8001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ml/, ""),
        secure: false,
      },
    },
  },

  optimizeDeps: {
    include: [
      "@tensorflow/tfjs",
      "@tensorflow/tfjs-core",
      "@tensorflow/tfjs-backend-webgl",
      "@tensorflow/tfjs-backend-cpu",
      "seedrandom",
    ],
  },

  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});