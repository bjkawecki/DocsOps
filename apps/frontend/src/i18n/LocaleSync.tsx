import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useMe } from '../hooks/useMe.js';
import { resolveAppLocale } from './resolveAppLocale.js';

/**
 * Keeps i18n language and <html lang> in sync with preference / ?lang= / browser.
 */
export function LocaleSync() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const { data: me, isSuccess } = useMe();
  const authenticated = isSuccess && me?.user != null;

  useEffect(() => {
    const locale = resolveAppLocale({
      preference: authenticated ? (me?.preferences?.locale ?? null) : null,
      search: location.search,
      browserLanguages: typeof navigator !== 'undefined' ? navigator.languages : undefined,
    });
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [authenticated, i18n, location.search, me?.preferences?.locale]);

  return null;
}
