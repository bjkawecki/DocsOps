import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Wenn du nur `pnpm --filter frontend dev` startest: /api → Backend (Standard 8080 wie `make dev`). */
const devApiTarget = process.env.VITE_DEV_PROXY_API ?? 'http://127.0.0.1:8080';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@tiptap') || id.includes('prosemirror')) return 'vendor-tiptap';
          if (id.includes('@mantine')) return 'vendor-mantine';
          if (id.includes('@tabler/icons-react')) return 'vendor-icons';
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          if (id.includes('react-markdown') || id.includes('remark-gfm')) return 'vendor-markdown';
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
    host: true,
    proxy: {
      '/api': { target: devApiTarget, changeOrigin: true },
      '/health': { target: devApiTarget, changeOrigin: true },
      '/ready': { target: devApiTarget, changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
} as Parameters<typeof defineConfig>[0] & { test?: object });
