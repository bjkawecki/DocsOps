import { notifications } from '@mantine/notifications';
import { createElement } from 'react';
import i18n from '../../i18n/i18n';
import type { PdfExportJobStatusResponse } from './documentPageTypes';

/** Not a React component; uses the i18n instance directly instead of the `useTranslation` hook. */
const t = (key: string, options?: Record<string, unknown>) =>
  i18n.t(key, { ns: 'documents', ...options });

export function pdfExportNotificationId(documentId: string): string {
  return `pdf-export-${documentId}`;
}

export function showPdfExportQueuedNotification(documentId: string): void {
  const id = pdfExportNotificationId(documentId);
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

export function updatePdfExportStatusNotification(
  documentId: string,
  status: PdfExportJobStatusResponse
): void {
  const id = pdfExportNotificationId(documentId);

  if (status.status === 'queued') {
    notifications.update({
      id,
      loading: true,
      title: t('pdfExport.queuedTitle'),
      message: t('pdfExport.waitingMessage'),
      color: 'blue',
      autoClose: false,
      withCloseButton: false,
    });
    return;
  }

  if (status.status === 'running') {
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
    notifications.update({
      id,
      loading: false,
      title: t('pdfExport.readyTitle'),
      message:
        downloadUrl != null
          ? createElement(
              'span',
              null,
              t('pdfExport.readyMessagePrefix'),
              createElement(
                'a',
                { href: downloadUrl, style: { fontWeight: 500 } },
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
    notifications.update({
      id,
      loading: false,
      title: t('pdfExport.failedTitle'),
      message: status.error ?? t('pdfExport.failedDefaultMessage'),
      color: 'red',
      autoClose: 10_000,
      withCloseButton: true,
    });
    return;
  }

  if (status.status === 'cancelled') {
    notifications.update({
      id,
      loading: false,
      title: t('pdfExport.cancelledTitle'),
      message: t('pdfExport.cancelledMessage'),
      color: 'yellow',
      autoClose: 10_000,
      withCloseButton: true,
    });
  }
}
