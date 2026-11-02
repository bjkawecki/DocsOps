/** Indexable landing routes for sitemap + prerender (no redirect-only paths). */
export type LandingSeoRoute = {
  path: string;
  priority: string;
  changefreq: 'weekly' | 'monthly' | 'yearly';
};

export const LANDING_SEO_ROUTES: readonly LandingSeoRoute[] = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/philosophie', priority: '0.8', changefreq: 'monthly' },
  { path: '/install', priority: '0.8', changefreq: 'monthly' },
  { path: '/changelog', priority: '0.6', changefreq: 'weekly' },
  { path: '/vergleich', priority: '0.5', changefreq: 'monthly' },
  { path: '/sponsor', priority: '0.4', changefreq: 'yearly' },
  { path: '/impressum', priority: '0.3', changefreq: 'yearly' },
  { path: '/datenschutz', priority: '0.3', changefreq: 'yearly' },
] as const;

export function isLabSiteUrl(siteUrl: string): boolean {
  try {
    const host = new URL(siteUrl).hostname;
    return host.endsWith('.local') || host === 'localhost' || host === '127.0.0.1';
  } catch {
    return false;
  }
}

export function normalizeSiteOrigin(siteUrl: string): string {
  return siteUrl.replace(/\/$/, '');
}
