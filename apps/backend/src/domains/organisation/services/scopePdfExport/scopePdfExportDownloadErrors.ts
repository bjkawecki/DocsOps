/** Stable API error codes for scope PDF download (JSON + HTML). */
export const SCOPE_PDF_EXPORT_DOWNLOAD_ERRORS = {
  NOT_FOUND: 'SCOPE_PDF_EXPORT_NOT_FOUND',
  NOT_READY: 'SCOPE_PDF_EXPORT_NOT_READY',
  OBJECT_MISSING: 'SCOPE_PDF_EXPORT_OBJECT_MISSING',
  STORAGE_UNAVAILABLE: 'SCOPE_PDF_EXPORT_STORAGE_UNAVAILABLE',
} as const;

export type ScopePdfExportDownloadErrorCode =
  (typeof SCOPE_PDF_EXPORT_DOWNLOAD_ERRORS)[keyof typeof SCOPE_PDF_EXPORT_DOWNLOAD_ERRORS];

const HTML_MESSAGES: Record<ScopePdfExportDownloadErrorCode, string> = {
  SCOPE_PDF_EXPORT_NOT_FOUND: 'This PDF export is no longer available.',
  SCOPE_PDF_EXPORT_NOT_READY: 'This PDF export is not ready for download yet.',
  SCOPE_PDF_EXPORT_OBJECT_MISSING: 'This PDF export archive is no longer available.',
  SCOPE_PDF_EXPORT_STORAGE_UNAVAILABLE: 'Object storage is not available.',
};

export function scopePdfExportDownloadErrorHtml(error: ScopePdfExportDownloadErrorCode): string {
  const message = HTML_MESSAGES[error];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PDF export unavailable</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.5; color: #111; }
    a { color: #1c7ed6; }
  </style>
</head>
<body>
  <h1>PDF export unavailable</h1>
  <p>${message}</p>
  <p>Start a new export from the context menu, or return to the app.</p>
  <p><a href="/">Back to DocsOps</a></p>
</body>
</html>`;
}

export function requestPrefersHtml(acceptHeader: string | string[] | undefined): boolean {
  const accept = Array.isArray(acceptHeader) ? acceptHeader.join(',') : (acceptHeader ?? '');
  return /text\/html/i.test(accept);
}
