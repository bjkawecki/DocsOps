import { notifications } from '@mantine/notifications';
import { createElement, type CSSProperties, type MouseEvent } from 'react';
import { downloadScopePdfExport } from '../../api/scopePdfExportDownload';
import i18n from '../../i18n/i18n';

const downloadLinkStyle: CSSProperties = {
  fontWeight: 500,
  padding: 0,
  border: 'none',
  background: 'none',
  color: 'inherit',
  textDecoration: 'underline',
  cursor: 'pointer',
  font: 'inherit',
};

const t = (key: string, options?: Record<string, unknown>) =>
  i18n.t(key, { ns: 'contexts', ...options });

export type ScopePdfExportStatusResponse = {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  downloadUrl: string | null;
  errorMessage: string | null;
  scopeKind: 'company' | 'department' | 'team' | null;
  docsOk: number;
  docsFailed: number;
  docsTotal: number;
};

function scopeKindLabel(kind: ScopePdfExportStatusResponse['scopeKind']): string {
  if (kind === 'company') return t('pdfExport.scopeKind.company');
  if (kind === 'department') return t('pdfExport.scopeKind.departments');
  if (kind === 'team') return t('pdfExport.scopeKind.teams');
  return t('pdfExport.scopeKind.unknown');
}

export function scopePdfExportNotificationId(contextId: string): string {
  return `scope-pdf-export-${contextId}`;
}

export function showScopePdfExportQueuedNotification(contextId: string): void {
  const id = scopePdfExportNotificationId(contextId);
  notifications.hide(id);
  notifications.show({
    id,
    loading: true,
    title: t('pdfExport.queuedTitle'),
    message: t('pdfExport.queuedMessage'),
    color: 'blue',
    autoClose: false,
    withCloseButton: false,
  });
}

export function updateScopePdfExportStatusNotification(
  contextId: string,
  status: ScopePdfExportStatusResponse
): void {
  const id = scopePdfExportNotificationId(contextId);

  if (status.status === 'queued' || status.status === 'running') {
    notifications.update({
      id,
      loading: true,
      title: t('pdfExport.inProgressTitle'),
      message: t('pdfExport.generatingMessage'),
      color: 'blue',
      autoClose: false,
      withCloseButton: false,
    });
    return;
  }

  if (status.status === 'succeeded') {
    const downloadUrl = status.downloadUrl;
    const scope = scopeKindLabel(status.scopeKind);
    notifications.update({
      id,
      loading: false,
      title: t('pdfExport.readyTitleScoped', { scope }),
      message:
        downloadUrl != null
          ? createElement(
              'span',
              null,
              t('pdfExport.readyMessagePrefix'),
              createElement(
                'button',
                {
                  type: 'button',
                  style: downloadLinkStyle,
                  onClick: (event: MouseEvent<HTMLButtonElement>) => {
                    event.preventDefault();
                    void downloadScopePdfExport(downloadUrl);
                  },
                },
                t('pdfExport.downloadLink')
              )
            )
          : t('pdfExport.successMessage'),
      color: 'green',
      autoClose: false,
      withCloseButton: true,
    });
    return;
  }

  if (status.status === 'failed') {
    const raw = status.errorMessage;
    const scope = scopeKindLabel(status.scopeKind);
    const message =
      raw === 'SCOPE_PDF_EXPORT_ZIP_NOT_FOUND'
        ? t('pdfExport.errors.zipNotFound')
        : raw?.startsWith('SCOPE_PDF_EXPORT_ZIP_FAILED')
          ? t('pdfExport.errors.zipFailed')
          : (raw ?? t('pdfExport.failedDefaultMessage'));
    notifications.update({
      id,
      loading: false,
      title: t('pdfExport.failedTitleScoped', { scope }),
      message,
      color: 'red',
      autoClose: 10_000,
      withCloseButton: true,
    });
  }
}
