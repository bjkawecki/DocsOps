import type { LandingLocale } from '../i18n/locale';

export type ShowroomScheme = 'light' | 'dark';

export type ShowroomSources = {
  avif: string;
  webp: string;
};

type AssetModule = { default: string };

/**
 * Dynamic imports so only the active locale×theme pair is fetched.
 * Vite resolves the template to the eight showroom-*.{avif,webp} assets.
 */
export function loadShowroomSources(
  locale: LandingLocale,
  scheme: ShowroomScheme
): Promise<ShowroomSources> {
  return Promise.all([
    import(`./images/showroom-${locale}-${scheme}.avif`) as Promise<AssetModule>,
    import(`./images/showroom-${locale}-${scheme}.webp`) as Promise<AssetModule>,
  ]).then(([avif, webp]) => ({
    avif: avif.default,
    webp: webp.default,
  }));
}

export const SHOWROOM_WIDTH = 2658;
export const SHOWROOM_HEIGHT = 1744;
