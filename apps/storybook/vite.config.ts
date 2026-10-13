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
      {
        find: "@rdx/ui/styles.css",
        replacement: path.join(uiPackage, "styles.css"),
      },
      {
        find: "@rdx/ui",
        replacement: path.join(uiPackage, "index.ts"),
      },
    ],
  },
  server: {
    fs: {
      allow: [monorepoRoot],
    },
  },
  optimizeDeps: {
    exclude: ["@rdx/ui"],
    include: [
      "@emotion/react",
      "@emotion/styled",
      "@mui/material",
      "@mui/x-data-grid-premium",
    ],
  },
});
