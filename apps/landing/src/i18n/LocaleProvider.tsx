import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  detectBrowserLocale,
  localeFromPathname,
  readStoredLocale,
  switchLocalePath,
  writeStoredLocale,
  type LandingLocale,
} from './locale';

type LocaleContextValue = {
  locale: LandingLocale;
  setLocale: (next: LandingLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * First visit without storage: non-`de*` browser language on an unprefixed URL
 * is redirected to the matching `/en` path. Explicit storage choice is never overridden.
 */
export function FirstVisitLocaleRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (readStoredLocale() !== null) return;
    if (localeFromPathname(location.pathname) === 'en') return;
    if (detectBrowserLocale() === 'de') return;
    const target = switchLocalePath(location.pathname + location.hash, 'en');
    void navigate(target, { replace: true });
  }, [location.pathname, location.hash, navigate]);

  return null;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const locale = localeFromPathname(location.pathname);

  const setLocale = useCallback(
    (next: LandingLocale) => {
      writeStoredLocale(next);
      const target = switchLocalePath(location.pathname + location.hash, next);
      void navigate(target);
    },
    [location.pathname, location.hash, navigate]
  );

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return ctx;
}
