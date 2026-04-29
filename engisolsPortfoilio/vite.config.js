import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sitemap from "vite-plugin-sitemap";
import { caseStudies } from "./src/data/caseStudies.js";

const caseStudyRoutes = caseStudies.map((cs) => `/case-studies/${cs.slug}`);

export default defineConfig({
  plugins: [
    react(),
    sitemap({
      hostname: "https://engisols.com",
      dynamicRoutes: ["/", ...caseStudyRoutes],
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
          if (id.includes("react-router")) {
            return "vendor-router";
          }
        },
      },
    },
  },
});
