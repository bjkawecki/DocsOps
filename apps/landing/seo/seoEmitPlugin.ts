import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { LANDING_SEO_ROUTES, isLabSiteUrl, normalizeSiteOrigin } from './routes.js';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildRobotsTxt(origin: string, lab: boolean): string {
  if (lab) {
    return ['User-agent: *', 'Disallow: /', ''].join('\n');
  }
  return ['User-agent: *', 'Allow: /', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n');
}

function pairLocalePath(path: string): { de: string; en: string } {
  if (path === '/en' || path.startsWith('/en/')) {
    const bare = path === '/en' ? '/' : path.slice(3);
    return { de: bare === '' ? '/' : bare, en: path };
  }
  return { de: path, en: path === '/' ? '/en' : `/en${path}` };
}

function locFor(origin: string, path: string): string {
  return path === '/' ? `${origin}/` : `${origin}${path}`;
}

function buildSitemapXml(origin: string): string {
  const urls = LANDING_SEO_ROUTES.map((route) => {
    const loc = locFor(origin, route.path);
    const { de, en } = pairLocalePath(route.path);
    return [
      '  <url>',
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <changefreq>${route.changefreq}</changefreq>`,
      `    <priority>${route.priority}</priority>`,
      `    <xhtml:link rel="alternate" hreflang="de" href="${escapeXml(locFor(origin, de))}" />`,
      `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(locFor(origin, en))}" />`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(locFor(origin, de))}" />`,
      '  </url>',
    ].join('\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

/**
 * Emits robots.txt (+ sitemap.xml for public builds) into the Vite outDir.
 * Requires VITE_SITE_URL (no silent fallback).
 */
export function landingSeoEmitPlugin(siteUrl: string | undefined): Plugin {
  return {
    name: 'docsops-landing-seo-emit',
    apply: 'build',
    writeBundle(options) {
      const raw = siteUrl?.trim();
      if (!raw) {
        throw new Error(
          'VITE_SITE_URL is required to emit robots.txt / sitemap.xml (see apps/landing/.env.example).'
        );
      }
      const origin = normalizeSiteOrigin(raw);
      const lab = isLabSiteUrl(origin);
      const dir = options.dir;
      if (!dir) {
        throw new Error('landingSeoEmitPlugin: writeBundle missing options.dir');
      }
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'robots.txt'), buildRobotsTxt(origin, lab), 'utf8');
      if (!lab) {
        writeFileSync(join(dir, 'sitemap.xml'), buildSitemapXml(origin), 'utf8');
      }
    },
  };
}
