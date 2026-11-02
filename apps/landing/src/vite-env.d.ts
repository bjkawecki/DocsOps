/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEMO_URL?: string;
  readonly VITE_GITHUB_REPO_URL?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_SPONSOR_GITHUB_URL?: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.md?raw' {
  const content: string;
  export default content;
}
