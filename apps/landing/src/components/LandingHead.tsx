import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSiteUrl } from '../config/env';
import { useLocale } from '../i18n/LocaleProvider';
import {
  localeFromPathname,
  localizePath,
  stripLocalePrefix,
  type LandingLocale,
} from '../i18n/locale';

type LandingHeadProps = {
  title: string;
  description?: string;
  /** Absolute path including leading slash; defaults to current location.pathname. */
  path?: string;
};

const OG_IMAGE_PATH = '/og-showroom.png';
const OG_IMAGE_WIDTH = '1200';
const OG_IMAGE_HEIGHT = '630';

function upsertMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    if (hreflang) element.setAttribute('hreflang', hreflang);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function absoluteUrl(path: string): string {
  const origin = getSiteUrl();
  if (path === '/' || path === '') return `${origin}/`;
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

function alternatePath(barePath: string, locale: LandingLocale): string {
  return localizePath(locale, barePath === '/' ? '/' : barePath);
}

export function LandingHead({ title, description, path }: LandingHeadProps) {
  const location = useLocation();
  const { locale } = useLocale();
  const resolvedPath = path ?? location.pathname;
  const barePath = stripLocalePrefix(resolvedPath);
  const pageUrl = absoluteUrl(resolvedPath);
  const imageUrl = absoluteUrl(OG_IMAGE_PATH);
  const deUrl = absoluteUrl(alternatePath(barePath, 'de'));
  const enUrl = absoluteUrl(alternatePath(barePath, 'en'));
  const pathLocale = localeFromPathname(resolvedPath);

  useEffect(() => {
    document.title = title;
    document.documentElement.lang = pathLocale;
    upsertLink('canonical', pageUrl);
    upsertLink('alternate', deUrl, 'de');
    upsertLink('alternate', enUrl, 'en');
    upsertLink('alternate', deUrl, 'x-default');
    upsertMeta('og:url', pageUrl, 'property');
    upsertMeta('og:title', title, 'property');
    upsertMeta('og:locale', pathLocale === 'de' ? 'de_DE' : 'en_US', 'property');
    upsertMeta('twitter:title', title);
    upsertMeta('og:image', imageUrl, 'property');
    upsertMeta('og:image:width', OG_IMAGE_WIDTH, 'property');
    upsertMeta('og:image:height', OG_IMAGE_HEIGHT, 'property');
    upsertMeta('twitter:image', imageUrl);
    upsertMeta('twitter:card', 'summary_large_image');
    if (description) {
      upsertMeta('description', description);
      upsertMeta('og:description', description, 'property');
      upsertMeta('twitter:description', description);
    }
  }, [title, description, pageUrl, imageUrl, deUrl, enUrl, pathLocale, locale]);

  return null;
}
