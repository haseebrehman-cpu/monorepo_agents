/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CTS_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
