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
import {
  createOrdersApi,
  verifyOrder,
  type OrderScope,
  type OrdersApi,
} from "./orders";
import {
  createProductsApi,
  getProductVariants,
  type ProductScope,
  type ProductsApi,
} from "./products";
import { createSessionApi, createSession, type SessionApi } from "./session";
import {
  createStreamApi,
  streamChatMessage,
  type StreamApi,
  type StreamChatHandlers,
} from "./stream";
import {
  SUPPORT_MESSAGE_MAX_CHARS,
  createSupportApi,
  getSupportHealth,
  listPageEvents,
  lookupOrder,
  sendPageEvent,
  sendSupportMessage,
  startConversation,
  streamSupportMessage,
  supportRequestId,
  type SupportApi,
  type SupportStreamHandlers,
} from "./support";

export type RdxApiClient = ApiClient & {
  chat: ChatApi;
  stream: StreamApi;
  session: SessionApi;
  health: HealthApi;
  cart: CartApi;
  orders: OrdersApi;
  products: ProductsApi;
  support: SupportApi;
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
    orders: createOrdersApi(client),
    products: createProductsApi(client),
    support: createSupportApi(client),
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
  createOrdersApi,
  createProductsApi,
  createSessionApi,
  createStreamApi,
  deleteCartLine,
  getCart,
  getCartAction,
  getHealthz,
  getProductVariants,
  getTurn,
  patchCartLine,
  sendChatMessage,
  streamChatMessage,
  createSession,
  verifyOrder,
  SUPPORT_MESSAGE_MAX_CHARS,
  createSupportApi,
  getSupportHealth,
  listPageEvents,
  lookupOrder,
  sendPageEvent,
  sendSupportMessage,
  startConversation,
  streamSupportMessage,
  supportRequestId,
};
export type {
  ApiClient,
  ApiClientOptions,
  CartApi,
  CartScope,
  CartWriteOptions,
  ChatApi,
  HealthApi,
  OrderScope,
  OrdersApi,
  ProductScope,
  ProductsApi,
  SessionApi,
  StreamApi,
  StreamChatHandlers,
  SupportApi,
  SupportStreamHandlers,
};
