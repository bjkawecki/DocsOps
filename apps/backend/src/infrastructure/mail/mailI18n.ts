import enEmails from './locales/en/emails.json' with { type: 'json' };
import deEmails from './locales/de/emails.json' with { type: 'json' };

export type MailLocale = 'en' | 'de';

type Catalog = typeof enEmails;

const catalogs: Record<MailLocale, Catalog> = {
  en: enEmails,
  de: deEmails,
};

export class MailI18nMissingKeyError extends Error {
  constructor(readonly key: string) {
    super(`Mail i18n EN key missing: ${key}`);
    this.name = 'MailI18nMissingKeyError';
  }
}

/**
 * Locale for outbound mail: recipient preferences.locale, else English.
 * Does not use browser Accept-Language or silent multi-step fallbacks.
 */
export function resolveMailLocale(preferences: unknown): MailLocale {
  if (preferences != null && typeof preferences === 'object' && !Array.isArray(preferences)) {
    const locale = (preferences as { locale?: unknown }).locale;
    if (locale === 'de' || locale === 'en') return locale;
  }
  return 'en';
}

function lookup(catalog: Catalog, key: string): string | undefined {
  const parts = key.split('.');
  let cur: unknown = catalog;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object' || Array.isArray(cur)) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === 'string' ? cur : undefined;
}

function interpolate(template: string, vars?: Record<string, string>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => vars[name] ?? '');
}

/**
 * Resolve a mail string. EN catalog is required; missing DE falls back to EN.
 */
export function tMail(
  locale: MailLocale,
  key: string,
  vars?: Record<string, string>
): string {
  const enValue = lookup(catalogs.en, key);
  if (enValue == null) {
    throw new MailI18nMissingKeyError(key);
  }
  const localized = locale === 'en' ? enValue : (lookup(catalogs.de, key) ?? enValue);
  return interpolate(localized, vars);
}

/** Human label for a notification event_type; unknown types use the raw slug. */
export function notificationEventLabel(locale: MailLocale, eventType: string): string {
  const key = `notification.event.${eventType}`;
  const enValue = lookup(catalogs.en, key);
  if (enValue != null) {
    return tMail(locale, key);
  }
  return eventType;
}

export function formatNotificationOutboxMail(
  locale: MailLocale,
  eventType: string
): { subject: string; text: string } {
  const eventLabel = notificationEventLabel(locale, eventType);
  return {
    subject: tMail(locale, 'notification.subject', { eventLabel }),
    text: tMail(locale, 'notification.body', { eventLabel }),
  };
}

export function formatSmtpTestMail(locale: MailLocale): { subject: string; text: string } {
  return {
    subject: tMail(locale, 'system.test.subject'),
    text: tMail(locale, 'system.test.body'),
  };
}

/** Prepared for password-reset mail when the feature sends mail. */
export function formatPasswordResetMail(
  locale: MailLocale,
  resetUrl: string
): { subject: string; text: string } {
  return {
    subject: tMail(locale, 'auth.reset.subject'),
    text: tMail(locale, 'auth.reset.body', { resetUrl }),
  };
}
