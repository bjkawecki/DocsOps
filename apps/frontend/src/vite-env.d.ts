/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_LIVE_EVENTS_FALLBACK_POLL_SECONDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
