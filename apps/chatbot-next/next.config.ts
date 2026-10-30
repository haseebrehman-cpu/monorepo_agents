import type { NextConfig } from "next";

const DEFAULT_CHAT_API_URL = "http://vlrhtlptxpq8r2eklos4klva.159.65.48.87.sslip.io";
const chatApiUrl = (process.env.CHAT_API_URL?.trim() || DEFAULT_CHAT_API_URL).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  transpilePackages: ["@rdx/api-client", "@rdx/chat-contract", "@rdx/ui"],
  async rewrites() {
    return [{ source: "/rdx-api/:path*", destination: `${chatApiUrl}/:path*` }];
  },
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
