import { describe, expect, it } from 'vitest';
import {
  formatNotificationOutboxMail,
  formatPasswordResetMail,
  formatSmtpTestMail,
  MailI18nMissingKeyError,
  resolveMailLocale,
  tMail,
} from './mailI18n.js';

describe('mailI18n', () => {
  it('resolveMailLocale reads preferences.locale or defaults to en', () => {
    expect(resolveMailLocale({ locale: 'de' })).toBe('de');
    expect(resolveMailLocale({ locale: 'en' })).toBe('en');
    expect(resolveMailLocale({})).toBe('en');
    expect(resolveMailLocale(null)).toBe('en');
    expect(resolveMailLocale({ locale: 'fr' })).toBe('en');
  });

  it('tMail interpolates and falls back DE→EN for missing DE key via EN catalog', () => {
    expect(tMail('en', 'system.test.subject')).toContain('SMTP');
    expect(tMail('de', 'system.test.subject')).toContain('SMTP');
    expect(() => tMail('en', 'does.not.exist')).toThrow(MailI18nMissingKeyError);
  });

  it('formatNotificationOutboxMail is localized and omits JSON payload', () => {
    const en = formatNotificationOutboxMail('en', 'document-updated');
    expect(en.subject).toBe('DocsOps: Document updated');
    expect(en.text).toContain('Document updated');
    expect(en.text).not.toContain('{');

    const de = formatNotificationOutboxMail('de', 'document-updated');
    expect(de.subject).toBe('DocsOps: Dokument aktualisiert');
    expect(de.text).toContain('Dokument aktualisiert');
  });

  it('unknown event types use the raw slug as label', () => {
    const mail = formatNotificationOutboxMail('en', 'custom-future-event');
    expect(mail.subject).toBe('DocsOps: custom-future-event');
  });

  it('formatSmtpTestMail and formatPasswordResetMail use catalog', () => {
    const test = formatSmtpTestMail('de');
    expect(test.text.toLowerCase()).toContain('test');
    const reset = formatPasswordResetMail('en', 'https://example.com/reset');
    expect(reset.text).toContain('https://example.com/reset');
  });
});
