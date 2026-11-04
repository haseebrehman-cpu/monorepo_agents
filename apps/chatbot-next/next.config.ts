import path from "node:path";
import type { NextConfig } from "next";

const DEFAULT_CHAT_API_URL = "http://1ub8qvevee1gpbhh9zj0qveh.159.65.48.87.sslip.io";
const chatApiUrl = (process.env.CHAT_API_URL?.trim() || DEFAULT_CHAT_API_URL).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@rdx/api-client", "@rdx/chat-contract", "@rdx/ui"],

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
