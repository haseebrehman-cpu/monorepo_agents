import { createRdxApiClient } from "@rdx/api-client";

const DEFAULT_CHAT_API_URL = "http://1ub8qvevee1gpbhh9zj0qveh.159.65.48.87.sslip.io";

const API_BASE = (process.env.NEXT_PUBLIC_CHAT_API_BASE?.trim() || DEFAULT_CHAT_API_URL).replace(
  /\/+$/,
  "",
);

export const api = createRdxApiClient({ baseUrl: API_BASE });
