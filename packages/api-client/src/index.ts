import {
  createCartApi,
  addCartLine,
  checkoutCart,
  deleteCartLine,
  getCart,
  getCartAction,
  patchCartLine,
  type CartApi,
  type CartScope,
  type CartWriteOptions,
} from "./cart";
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
  cart: CartApi;
};

/** Factory used by apps — attach namespaced API modules here as they grow. */
export function createRdxApiClient(options: ApiClientOptions): RdxApiClient {
  const client = createApiClient(options);
  return Object.assign(client, {
    chat: createChatApi(client),
    stream: createStreamApi(client),
    session: createSessionApi(client),
    health: createHealthApi(client),
    cart: createCartApi(client),
  });
}

export {
  ApiError,
  addCartLine,
  checkoutCart,
  createApiClient,
  createCartApi,
  createChatApi,
  createHealthApi,
  createSessionApi,
  createStreamApi,
  deleteCartLine,
  getCart,
  getCartAction,
  getHealthz,
  getTurn,
  patchCartLine,
  sendChatMessage,
  streamChatMessage,
  createSession,
};
export type {
  ApiClient,
  ApiClientOptions,
  CartApi,
  CartScope,
  CartWriteOptions,
  ChatApi,
  HealthApi,
  SessionApi,
  StreamApi,
  StreamChatHandlers,
};
