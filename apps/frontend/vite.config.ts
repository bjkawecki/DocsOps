import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

/** Wenn du nur `pnpm --filter frontend dev` startest: /api → Backend (Standard 8080 wie `make dev`). */
const devApiTarget = process.env.VITE_DEV_PROXY_API ?? 'http://127.0.0.1:8080';
/** Default loopback; Docker Compose sets `VITE_DEV_SERVER_HOST=0.0.0.0` for Caddy. */
const devServerHost = process.env.VITE_DEV_SERVER_HOST ?? '127.0.0.1';

/** Heavy editor/diagram deps – never modulepreload on the shell entry. */
const DEFER_PRELOAD_RE =
  /vendor-tiptap|\/mermaid|\/elk|\/katex|\/cytoscape|dagre-|graphlib-|rough\.esm|vendor-markdown/;

export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: {
      resolveDependencies(filename, deps, { hostType }) {
        // Vite types: hostType is 'html' | 'js' (entry document is 'html').
        if (hostType !== 'html' && !filename.includes('index')) {
          return deps;
        }
        // Entry HTML must not preload TipTap/Mermaid just because DocumentPage is lazy() in App.
        return deps.filter((dep) => !DEFER_PRELOAD_RE.test(dep));
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Keep shared React shims out of TipTap/editor chunks (otherwise i18n imports TipTap).
          if (id.includes('use-sync-external-store')) return 'vendor-react';
          // TipTap stays with the document editor async graph – do not force a shared vendor chunk.
          if (id.includes('@tiptap') || id.includes('prosemirror')) return undefined;
          if (id.includes('@mantine')) return 'vendor-mantine';
          if (id.includes('@tabler/icons-react')) return 'vendor-icons';
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          if (
            id.includes('react-markdown') ||
            id.includes('remark-gfm') ||
            id.includes('/remark-') ||
            id.includes('/unified/') ||
            id.includes('/mdast-') ||
            id.includes('/micromark')
          ) {
            return 'vendor-markdown';
          }
          if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
          if (
            id.includes('/react-dom/') ||
            id.includes('/react-router') ||
            id.includes('/scheduler/') ||
            id.includes('/react/')
          ) {
            return 'vendor-react';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    host: devServerHost,
    proxy: {
      '/api': { target: devApiTarget, changeOrigin: true },
      // Exact probe only – prefix would otherwise catch unrelated SPA paths.
      '/health': {
        target: devApiTarget,
        changeOrigin: true,
        bypass(req) {
          const path = req.url?.split('?')[0] ?? '';
          if (path !== '/health') return req.url ?? path;
          return undefined;
        },
      },
      '/ready': {
        target: devApiTarget,
        changeOrigin: true,
        bypass(req) {
          const path = req.url?.split('?')[0] ?? '';
          if (path !== '/ready') return req.url ?? path;
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
});
