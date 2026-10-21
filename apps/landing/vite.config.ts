import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { landingSeoEmitPlugin } from './seo/seoEmitPlugin.js';

const landingDir = dirname(fileURLToPath(import.meta.url));
const rootPackage = JSON.parse(readFileSync(resolve(landingDir, '../../package.json'), 'utf8')) as {
  version: string;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, landingDir, '');
  const appVersion = rootPackage.version?.trim();
  if (!appVersion) {
    throw new Error('Root package.json version is required for landing build.');
  }

  const siteUrl = (process.env.VITE_SITE_URL?.trim() || env.VITE_SITE_URL?.trim()) ?? '';

  return {
    plugins: [react(), landingSeoEmitPlugin(siteUrl || undefined)],
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    },
    envDir: landingDir,
    build: {
      rollupOptions: {
        output: {
          // Vite 8 / Rolldown: object form no longer accepted; map by module id.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('@mantine')) return 'mantine';
            if (id.includes('@xyflow')) return 'xyflow';
            if (id.includes('react-markdown') || id.includes('remark-gfm')) return 'markdown';
            if (
              id.includes('/react-dom/') ||
              id.includes('/react-router') ||
              id.includes('/scheduler/') ||
              id.includes('/react/')
            ) {
              return 'react';
            }
            return undefined;
          },
        },
      },
    },
    server: {
      port: 5174,
      host: process.env.VITE_DEV_SERVER_HOST ?? '127.0.0.1',
      fs: {
        allow: [resolve(landingDir, '../..')],
      },
    },
  };
});
