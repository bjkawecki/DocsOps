import { describe, expect, it } from 'vitest';
import {
  buildPdfResponsibleMetaLine,
  formatPdfMetaDate,
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
