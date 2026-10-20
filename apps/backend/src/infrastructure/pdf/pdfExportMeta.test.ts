import { describe, expect, it } from 'vitest';
import { buildPdfResponsibleMetaLine } from './pdfExportMeta.js';

describe('buildPdfResponsibleMetaLine', () => {
  it('formats responsible names, version and date', () => {
    expect(
      buildPdfResponsibleMetaLine({
        responsibleNames: ['Ada', 'Bob'],
        versionNumber: 3,
        publishedAt: new Date('2026-10-20T12:00:00.000Z'),
      })
    ).toBe('Responsible: Ada, Bob · Version 3 · 2026-10-20');
  });

  it('uses n/a when no responsible names', () => {
    expect(
      buildPdfResponsibleMetaLine({
        responsibleNames: [],
        versionNumber: 1,
        publishedAt: new Date('2026-01-02T00:00:00.000Z'),
      })
    ).toBe('Responsible: n/a · Version 1 · 2026-01-02');
  });
});
