import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const landingDir = dirname(fileURLToPath(import.meta.url));
const rootPackage = JSON.parse(readFileSync(resolve(landingDir, '../../package.json'), 'utf8')) as {
  version: string;
};

export default defineConfig(({ mode }) => {
  loadEnv(mode, landingDir, '');
  const appVersion = rootPackage.version?.trim();
  if (!appVersion) {
    throw new Error('Root package.json version is required for landing build.');
  }

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    },
    envDir: landingDir,
    server: {
      port: 5174,
      host: true,
    },
  };
});
