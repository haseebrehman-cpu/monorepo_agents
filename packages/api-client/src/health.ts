import type { HealthzResponse } from "@rdx/chat-contract";
import type { ApiClient } from "./http";

export async function getHealthz(client: ApiClient): Promise<HealthzResponse> {
  return client.request<HealthzResponse>("/healthz");
}

export type HealthApi = {
  get: () => Promise<HealthzResponse>;
};

export function createHealthApi(client: ApiClient): HealthApi {
  return {
    get: () => getHealthz(client),
  };
}
