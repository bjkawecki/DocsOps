import { Anchor } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createElement } from 'react';
import type { PdfExportJobStatusResponse } from './documentPageTypes';

export function pdfExportNotificationId(documentId: string): string {
  return `pdf-export-${documentId}`;
}

export function showPdfExportQueuedNotification(documentId: string): void {
  const id = pdfExportNotificationId(documentId);
  notifications.hide(id);
  notifications.show({
    id,
    loading: true,
    title: 'PDF export queued',
    message: 'Your document export was queued and will run in the background.',
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
      title: 'PDF export queued',
      message: 'Waiting for the export worker…',
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
      title: 'PDF export in progress',
      message: 'Generating your PDF…',
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
      title: 'PDF export ready',
      message:
        downloadUrl != null
          ? createElement(
              'span',
              null,
              'Your PDF is ready. ',
              createElement(Anchor, { href: downloadUrl, size: 'sm', fw: 500 }, 'Download PDF')
            )
          : 'Your PDF export finished successfully.',
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
      title: 'PDF export failed',
      message: status.error ?? 'Export could not be completed.',
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
      title: 'PDF export cancelled',
      message: 'The PDF export was cancelled.',
      color: 'yellow',
      autoClose: 10_000,
      withCloseButton: true,
    });
  }
}
