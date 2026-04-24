import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sitemap from "vite-plugin-sitemap";

export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: "https://engisols.com",
      dynamicRoutes: ["/"],
      generateRobotsTxt: true,
      readable: true,
    }),
  ],
  build: {
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("three") || id.includes("@react-three")) {
            return "vendor-three";
          }
          if (id.includes("framer-motion")) {
            return "vendor-motion";
          }
          if (id.includes("@tsparticles")) {
            return "vendor-particles";
          }
          if (id.includes("react-icons")) {
            return "vendor-icons";
          }
          if (id.includes("lucide-react")) {
            return "vendor-lucide";
          }
        },
      },
    },
  },
});
