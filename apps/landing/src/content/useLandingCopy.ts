import { useLocale } from '../i18n/LocaleProvider';
import { getLandingCopy, type LandingCopy } from './index';

export function useLandingCopy(): LandingCopy {
  const { locale } = useLocale();
  return getLandingCopy(locale);
}
