import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const appDir = fileURLToPath(new URL(".", import.meta.url));
const monorepoRoot = path.join(appDir, "../..");
const uiPackage = path.join(monorepoRoot, "packages/ui");
const STAGE_API_URL = "https://backend-staging-8230.up.railway.app/";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, appDir, "");
  const apiTarget = env.VITE_CHAT_API_URL?.trim() || STAGE_API_URL;
  const apiProxy = {
    target: apiTarget,
    changeOrigin: true,
    secure: true,
    rewrite: (requestPath: string) => requestPath.replace(/^\/rdx-api/, ""),
  };

  return {
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
          replacement: path.join(
            monorepoRoot,
            "packages/api-client/src/index.ts",
          ),
        },
        {
          find: "@rdx/chat-contract",
          replacement: path.join(
            monorepoRoot,
            "packages/chat-contract/src/index.ts",
          ),
        },
        {
          find: "@",
          replacement: path.join(appDir, "src"),
        },
      ],
    },
    server: {
      fs: {
        allow: [monorepoRoot],
      },
      proxy: {
        "/rdx-api": apiProxy,
      },
    },
    preview: {
      proxy: {
        "/rdx-api": apiProxy,
      },
    },
    optimizeDeps: {
      exclude: ["@rdx/api-client", "@rdx/chat-contract", "@rdx/ui"],
    },
  };
});
