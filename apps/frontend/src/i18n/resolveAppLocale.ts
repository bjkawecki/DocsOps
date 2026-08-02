export type AppLocale = 'en' | 'de';

const SUPPORTED: readonly AppLocale[] = ['en', 'de'];

function normalizeLocale(raw: string | null | undefined): AppLocale | null {
  if (raw == null || raw === '') return null;
  const base = raw.trim().toLowerCase().split('-')[0];
  if (base === 'en' || base === 'de') return base;
  return null;
}

export function parseLangQueryParam(search: string): AppLocale | null {
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    return normalizeLocale(params.get('lang'));
  } catch {
    return null;
  }
}

export function localeFromBrowser(languages: readonly string[] | undefined): AppLocale | null {
  if (languages == null) return null;
  for (const lang of languages) {
    const matched = normalizeLocale(lang);
    if (matched != null) return matched;
  }
  return null;
}

/**
 * Resolve UI locale: preference → ?lang= → browser → en.
 * Pass preference only when the user is authenticated and preferences are loaded.
 */
export function resolveAppLocale(input: {
  preference?: string | null;
  search?: string;
  browserLanguages?: readonly string[];
}): AppLocale {
  const fromPref = normalizeLocale(input.preference ?? undefined);
  if (fromPref != null && SUPPORTED.includes(fromPref)) return fromPref;

  const fromQuery = parseLangQueryParam(input.search ?? '');
  if (fromQuery != null) return fromQuery;

  const fromBrowser = localeFromBrowser(input.browserLanguages ?? navigator.languages);
  if (fromBrowser != null) return fromBrowser;

  return 'en';
}
