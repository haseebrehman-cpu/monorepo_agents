import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const appDir = fileURLToPath(new URL(".", import.meta.url));
const monorepoRoot = path.join(appDir, "../..");
const uiPackage = path.join(monorepoRoot, "packages/ui");

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      // More specific subpath first — otherwise `@rdx/ui` swallows `styles.css`.
      {
        find: "@rdx/ui/styles.css",
        replacement: path.join(uiPackage, "styles.css"),
      },
      {
        find: "@rdx/ui",
        replacement: path.join(uiPackage, "index.ts"),
      },
      {
        find: "@rdx/api-client",
        replacement: path.join(monorepoRoot, "packages/api-client/src/index.ts"),
      },
    ],
  },
  base: '/cts-dashboard',
  server: {
    fs: {
      allow: [monorepoRoot],
    },
    proxy: {
      "/cts-api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/cts-api/, ""),
      },
    },
  },
  optimizeDeps: {
    exclude: ["@rdx/api-client", "@rdx/ui"],
    include: [
      "@emotion/react",
      "@emotion/styled",
      "@mui/material",
      "@mui/x-charts-premium",
      "@mui/x-data-grid-premium",
    ],
  },
});
