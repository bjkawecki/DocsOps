import { notifications } from '@mantine/notifications';
import i18n from '../i18n/i18n.js';
import { apiFetch } from './client.js';

function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, { ns: 'contexts', ...options });
}

function fileNameFromContentDisposition(header: string | null): string | null {
  if (header == null || header.trim() === '') return null;
  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted?.[1]) return quoted[1].trim();
  const plain = /filename=([^;]+)/i.exec(header);
  return plain?.[1]?.trim().replace(/^["']|["']$/g, '') || null;
}

async function readApiError(res: Response): Promise<string | null> {
  try {
    const body = (await res.json()) as { error?: unknown };
    return typeof body.error === 'string' ? body.error : null;
  } catch {
    return null;
  }
}

function messageForDownloadFailure(status: number, error: string | null): string {
  if (
    error === 'SCOPE_PDF_EXPORT_NOT_FOUND' ||
    error === 'SCOPE_PDF_EXPORT_OBJECT_MISSING' ||
    status === 404
  ) {
    return t('pdfExport.errors.downloadUnavailable');
  }
  if (error === 'SCOPE_PDF_EXPORT_NOT_READY' || status === 409) {
    return t('pdfExport.errors.downloadNotReady');
  }
  if (error === 'SCOPE_PDF_EXPORT_STORAGE_UNAVAILABLE' || status === 503) {
    return t('pdfExport.errors.downloadStorageUnavailable');
  }
  return t('pdfExport.errors.downloadFailed');
}

/**
 * Fetches a scope PDF zip with cookies and triggers a browser download.
 * On failure shows a toast and stays in the SPA (no raw JSON page).
 */
export async function downloadScopePdfExport(apiPath: string): Promise<boolean> {
  const res = await apiFetch(apiPath);
  if (!res.ok) {
    const error = await readApiError(res);
    notifications.show({
      title: t('pdfExport.downloadFailedTitle'),
      message: messageForDownloadFailure(res.status, error),
      color: 'red',
      autoClose: 8_000,
    });
    return false;
  }

  const blob = await res.blob();
  const fileName =
    fileNameFromContentDisposition(res.headers.get('Content-Disposition')) ??
    'docsops-pdf-export.zip';
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
