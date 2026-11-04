/**
 * Indexable landing routes for sitemap + prerender (SSoT).
 * English path segments; DE unprefixed, EN under `/en/…`.
 */

export type LandingSeoRoute = {
  path: string;
  priority: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
};

type BaseRoute = {
  slug: string;
  priority: string;
  changefreq: LandingSeoRoute['changefreq'];
};

const BASE_ROUTES: BaseRoute[] = [
  { slug: '', priority: '1.0', changefreq: 'weekly' },
  { slug: 'philosophy', priority: '0.8', changefreq: 'monthly' },
  { slug: 'install', priority: '0.8', changefreq: 'monthly' },
  { slug: 'changelog', priority: '0.6', changefreq: 'weekly' },
  { slug: 'compare', priority: '0.5', changefreq: 'monthly' },
  { slug: 'sponsor', priority: '0.4', changefreq: 'yearly' },
  { slug: 'legal/imprint', priority: '0.3', changefreq: 'yearly' },
  { slug: 'legal/privacy', priority: '0.3', changefreq: 'yearly' },
];

function pathForSlug(locale: 'de' | 'en', slug: string): string {
  if (locale === 'de') {
    return slug === '' ? '/' : `/${slug}`;
  }
  return slug === '' ? '/en' : `/en/${slug}`;
}

export const LANDING_SEO_ROUTES: LandingSeoRoute[] = BASE_ROUTES.flatMap((route) => [
  {
    path: pathForSlug('de', route.slug),
    priority: route.priority,
    changefreq: route.changefreq,
  },
  {
    path: pathForSlug('en', route.slug),
    priority: route.priority,
    changefreq: route.changefreq,
  },
]);

export function normalizeSiteOrigin(siteUrl: string): string {
  return siteUrl.replace(/\/$/, '');
}

export function isLabSiteUrl(origin: string): boolean {
  try {
    const host = new URL(origin).hostname;
    return host.endsWith('.local') || host === 'localhost' || host === '127.0.0.1';
  } catch {
    return false;
  }
}
