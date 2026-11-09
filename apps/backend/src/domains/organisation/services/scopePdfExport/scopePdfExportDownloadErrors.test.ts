import { describe, expect, it } from 'vitest';
import {
  requestPrefersHtml,
  SCOPE_PDF_EXPORT_DOWNLOAD_ERRORS,
  scopePdfExportDownloadErrorHtml,
} from './scopePdfExportDownloadErrors.js';

describe('scopePdfExportDownloadErrors', () => {
  it('requestPrefersHtml detects browser Accept', () => {
    expect(requestPrefersHtml('text/html,application/xhtml+xml')).toBe(true);
    expect(requestPrefersHtml('application/json')).toBe(false);
    expect(requestPrefersHtml('*/*')).toBe(false);
  });

  it('HTML error page mentions unavailable export', () => {
    const html = scopePdfExportDownloadErrorHtml(SCOPE_PDF_EXPORT_DOWNLOAD_ERRORS.NOT_FOUND);
    expect(html).toContain('PDF export unavailable');
    expect(html).toContain('no longer available');
    expect(html).toContain('href="/"');
  });
});
