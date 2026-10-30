import { createRdxApiClient } from "@rdx/api-client";

const API_BASE = process.env.NEXT_PUBLIC_CHAT_API_BASE?.trim() || "/rdx-api";

export const api = createRdxApiClient({ baseUrl: API_BASE });
