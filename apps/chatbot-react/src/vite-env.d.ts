/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STORE_NAME?: string;
  readonly VITE_STOREFRONT_HOST?: string;
  readonly VITE_CHAT_API_URL?: string;
  readonly VITE_TENANT?: string;
  readonly VITE_SESSION_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
