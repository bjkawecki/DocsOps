export const LOCALES = ['de', 'en'] as const;
export type LandingLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: LandingLocale = 'de';
export const LOCALE_STORAGE_KEY = 'docsops-landing-locale';

/** English path segments shared by DE (unprefixed) and EN (`/en/…`). */
export const LANDING_SLUGS = {
  home: '',
  philosophy: 'philosophy',
  install: 'install',
  changelog: 'changelog',
  sponsor: 'sponsor',
  compare: 'compare',
  legalImprint: 'legal/imprint',
  legalPrivacy: 'legal/privacy',
} as const;

export type LandingSlugKey = keyof typeof LANDING_SLUGS;

export const HOME_HASH = {
  scope: 'scope',
  context: 'context',
  roles: 'roles',
  example: 'example',
  features: 'features',
  faq: 'faq',
} as const;

export function isLandingLocale(value: string): value is LandingLocale {
  return (LOCALES as readonly string[]).includes(value);
}

export function localeFromPathname(pathname: string): LandingLocale {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (normalized === '/en' || normalized.startsWith('/en/')) return 'en';
  return 'de';
}

/** Strip `/en` prefix; returns path starting with `/` or `/` for home. */
export function stripLocalePrefix(pathname: string): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (normalized === '/en') return '/';
  if (normalized.startsWith('/en/')) {
    const rest = normalized.slice(3);
    return rest.startsWith('/') ? rest : `/${rest}`;
  }
  return normalized;
}

export function pathFor(locale: LandingLocale, slugKey: LandingSlugKey, hash?: string): string {
  const slug = LANDING_SLUGS[slugKey];
  const base =
    locale === 'en' ? (slug === '' ? '/en' : `/en/${slug}`) : slug === '' ? '/' : `/${slug}`;
  if (!hash) return base;
  const id = hash.replace(/^#/, '');
  if (base === '/') return `/#${id}`;
  return `${base}#${id}`;
}

/** Build locale path for an already-English bare path (`/philosophy`, `/`, …). */
export function localizePath(locale: LandingLocale, barePath: string): string {
  const pathOnly = barePath.split('#')[0] ?? barePath;
  const hash = barePath.includes('#') ? barePath.slice(barePath.indexOf('#') + 1) : undefined;
  const normalized =
    pathOnly === '' || pathOnly === '/'
      ? '/'
      : pathOnly.startsWith('/')
        ? pathOnly
        : `/${pathOnly}`;

  let result: string;
  if (locale === 'en') {
    result = normalized === '/' ? '/en' : `/en${normalized}`;
  } else {
    result = normalized;
  }
  return hash ? `${result}#${hash}` : result;
}

export function switchLocalePath(pathname: string, next: LandingLocale): string {
  const bare = stripLocalePrefix(pathname);
  return localizePath(next, bare);
}

export function readStoredLocale(): LandingLocale | null {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw && isLandingLocale(raw)) return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredLocale(locale: LandingLocale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

export function detectBrowserLocale(): LandingLocale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  const candidates = [navigator.language, ...(navigator.languages ?? [])];
  for (const tag of candidates) {
    if (!tag) continue;
    const lower = tag.toLowerCase();
    if (lower === 'de' || lower.startsWith('de-')) return 'de';
  }
  return 'en';
}
