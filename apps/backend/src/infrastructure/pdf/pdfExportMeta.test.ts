import { describe, expect, it } from 'vitest';
import {
  buildPdfResponsibleMetaLine,
  formatPdfMetaDate,
  localeFromAcceptLanguage,
  localeFromPreferences,
  resolvePdfExportLocale,
  resolvePdfMetaLocale,
} from './pdfExportMeta.js';

describe('resolvePdfMetaLocale', () => {
  it('reads en/de from preferences or defaults to en', () => {
    expect(resolvePdfMetaLocale({ locale: 'de' })).toBe('de');
    expect(resolvePdfMetaLocale({ locale: 'en' })).toBe('en');
    expect(resolvePdfMetaLocale(null)).toBe('en');
    expect(resolvePdfMetaLocale({ locale: 'fr' })).toBe('en');
  });
});

describe('localeFromPreferences / localeFromAcceptLanguage', () => {
  it('returns null when preference unset', () => {
    expect(localeFromPreferences(null)).toBeNull();
    expect(localeFromPreferences({})).toBeNull();
  });

  it('parses Accept-Language', () => {
    expect(localeFromAcceptLanguage('de-DE,de;q=0.9,en;q=0.8')).toBe('de');
    expect(localeFromAcceptLanguage('en-US,en;q=0.9')).toBe('en');
    expect(localeFromAcceptLanguage(undefined)).toBeNull();
  });
});

describe('resolvePdfExportLocale', () => {
  it('prefers body, then preferences, then Accept-Language', () => {
    expect(
      resolvePdfExportLocale({
        bodyLocale: 'de',
        preferences: { locale: 'en' },
        acceptLanguage: 'en',
      })
    ).toBe('de');
    expect(
      resolvePdfExportLocale({
        bodyLocale: null,
        preferences: { locale: 'de' },
        acceptLanguage: 'en',
      })
    ).toBe('de');
    expect(
      resolvePdfExportLocale({
        bodyLocale: null,
        preferences: null,
        acceptLanguage: 'de-DE,de;q=0.9',
      })
    ).toBe('de');
    expect(resolvePdfExportLocale({})).toBe('en');
  });
});

describe('formatPdfMetaDate', () => {
  it('formats ISO for en and German day.month.year for de', () => {
    const d = new Date('2026-10-20T12:00:00.000Z');
    expect(formatPdfMetaDate(d, 'en')).toBe('2026-10-20');
    expect(formatPdfMetaDate(d, 'de')).toBe('20.10.2026');
  });
});

describe('buildPdfResponsibleMetaLine', () => {
  it('formats name, date and version (en default)', () => {
    expect(
      buildPdfResponsibleMetaLine({
        responsibleNames: ['Ada', 'Bob'],
        versionNumber: 3,
        publishedAt: new Date('2026-10-20T12:00:00.000Z'),
      })
    ).toBe('Ada, Bob, 2026-10-20, Version 3');
  });

  it('formats German date when locale is de', () => {
    expect(
      buildPdfResponsibleMetaLine({
        responsibleNames: ['Company Lead'],
        versionNumber: 1,
        publishedAt: new Date('2026-10-20T12:00:00.000Z'),
        locale: 'de',
      })
    ).toBe('Company Lead, 20.10.2026, Version 1');
  });

  it('omits names when none are available', () => {
    expect(
      buildPdfResponsibleMetaLine({
        responsibleNames: [],
        versionNumber: 1,
        publishedAt: new Date('2026-01-02T00:00:00.000Z'),
      })
    ).toBe('2026-01-02, Version 1');
  });
});
