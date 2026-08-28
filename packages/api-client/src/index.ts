import { createChatApi, sendChatMessage, type ChatApi } from "./chat";
import {
  ApiError,
  createApiClient,
  type ApiClient,
  type ApiClientOptions,
} from "./http";

export type RdxApiClient = ApiClient & {
  chat: ChatApi;
};

/** Factory used by apps — attach namespaced API modules here as they grow. */

export function createRdxApiClient(options: ApiClientOptions): RdxApiClient {
  const client = createApiClient(options);
  return Object.assign(client, {
    chat: createChatApi(client),
  });
}

export {
  ApiError,
  createApiClient,
  createChatApi,
  sendChatMessage,
};
export type { ApiClient, ApiClientOptions, ChatApi };
