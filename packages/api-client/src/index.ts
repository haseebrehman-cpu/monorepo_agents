import { createChatApi, sendChatMessage, getTurn, type ChatApi } from "./chat";
import { createHealthApi, getHealthz, type HealthApi } from "./health";
import {
  ApiError,
  createApiClient,
  type ApiClient,
  type ApiClientOptions,
} from "./http";
import { createSessionApi, createSession, type SessionApi } from "./session";
import {
  createStreamApi,
  streamChatMessage,
  type StreamApi,
  type StreamChatHandlers,
} from "./stream";

export type RdxApiClient = ApiClient & {
  chat: ChatApi;
  stream: StreamApi;
  session: SessionApi;
  health: HealthApi;
};

/** Factory used by apps — attach namespaced API modules here as they grow. */
export function createRdxApiClient(options: ApiClientOptions): RdxApiClient {
  const client = createApiClient(options);
  return Object.assign(client, {
    chat: createChatApi(client),
    stream: createStreamApi(client),
    session: createSessionApi(client),
    health: createHealthApi(client),
  });
}

export {
  ApiError,
  createApiClient,
  createChatApi,
  createHealthApi,
  createSessionApi,
  createStreamApi,
  getHealthz,
  getTurn,
  sendChatMessage,
  streamChatMessage,
  createSession,
};
export type {
  ApiClient,
  ApiClientOptions,
  ChatApi,
  HealthApi,
  SessionApi,
  StreamApi,
  StreamChatHandlers,
};
