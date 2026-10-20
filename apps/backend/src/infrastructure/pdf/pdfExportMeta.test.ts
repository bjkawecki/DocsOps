import { describe, expect, it } from 'vitest';
import { buildPdfResponsibleMetaLine } from './pdfExportMeta.js';

describe('buildPdfResponsibleMetaLine', () => {
  it('formats name, date and version', () => {
    expect(
      buildPdfResponsibleMetaLine({
        responsibleNames: ['Ada', 'Bob'],
        versionNumber: 3,
        publishedAt: new Date('2026-10-20T12:00:00.000Z'),
      })
    ).toBe('Ada, Bob, 2026-10-20, Version 3');
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
