/**
 * Post-build prerender for DocsOps landing SPA.
 *
 * Usage (from apps/landing):
 *   pnpm exec tsx scripts/prerender.ts --outDir dist-public
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { LANDING_SEO_ROUTES } from '../seo/routes.ts';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.ico': 'image/x-icon',
};

function parseOutDir(argv: string[]): string {
  const idx = argv.indexOf('--outDir');
  if (idx >= 0 && argv[idx + 1]) {
    return resolve(appDir, argv[idx + 1]);
  }
  return resolve(appDir, 'dist');
}

function routeToFile(outDir: string, path: string): string {
  if (path === '/') return join(outDir, 'index.html');
  const dir = join(outDir, path.replace(/^\//, ''));
  mkdirSync(dir, { recursive: true });
  return join(dir, 'index.html');
}

function resolveStaticFile(outDir: string, urlPath: string): string {
  const cleaned = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  const candidate = join(outDir, cleaned === '/' ? 'index.html' : cleaned);
  if (existsSync(candidate) && statSync(candidate).isFile()) {
    return candidate;
  }
  return join(outDir, 'index.html');
}

async function main(): Promise<void> {
  const outDir = parseOutDir(process.argv.slice(2));
  if (!existsSync(outDir) || !statSync(outDir).isDirectory()) {
    throw new Error(`Prerender outDir does not exist: ${outDir}`);
  }
  if (!existsSync(join(outDir, 'index.html'))) {
    throw new Error(`Missing ${join(outDir, 'index.html')} – run vite build first.`);
  }

  const server = createServer((request, response) => {
    const filePath = resolveStaticFile(outDir, request.url ?? '/');
    const type = MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': type });
    createReadStream(filePath).pipe(response);
  });

  await new Promise<void>((resolveListen) => {
    server.listen(0, '127.0.0.1', () => resolveListen());
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind prerender preview server');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const browser = await chromium.launch({ headless: true });
  try {
    for (const route of LANDING_SEO_ROUTES) {
      const page = await browser.newPage();
      const url = route.path === '/' ? `${baseUrl}/` : `${baseUrl}${route.path}`;
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForSelector('h1', { timeout: 30_000 });
      await new Promise((r) => setTimeout(r, 150));
      const html = await page.content();
      const target = routeToFile(outDir, route.path);
      const body =
        html.startsWith('<!DOCTYPE html>') || html.startsWith('<!doctype html>')
          ? html
          : `<!DOCTYPE html>\n${html}`;
      writeFileSync(target, body, 'utf8');
      console.log(`prerender: ${route.path} -> ${target}`);
      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise<void>((resolveClose, reject) => {
      server.close((err) => (err ? reject(err) : resolveClose()));
    });
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
