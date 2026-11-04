import type { LandingLocale } from '../i18n/locale';
import * as deComparison from './de/comparison';
import * as deFaq from './de/faq';
import * as deFeatures from './de/features';
import * as deLegal from './de/legalCopy';
import * as deSite from './de/siteCopy';
import * as enComparison from './en/comparison';
import * as enFaq from './en/faq';
import * as enFeatures from './en/features';
import * as enLegal from './en/legalCopy';
import * as enSite from './en/siteCopy';

const byLocale = {
  de: {
    site: deSite,
    legal: deLegal,
    faq: deFaq,
    features: deFeatures,
    comparison: deComparison,
  },
  en: {
    site: enSite,
    legal: enLegal,
    faq: enFaq,
    features: enFeatures,
    comparison: enComparison,
  },
} as const;

export type LandingCopy = (typeof byLocale)[LandingLocale];

export function getLandingCopy(locale: LandingLocale): LandingCopy {
  return byLocale[locale];
}

export { formatReleaseDate, getLandingReleases } from './releases';
