import { Menu } from '@mantine/core';
import { IconDownload, IconRefresh } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client.js';
import type { DocumentResponse } from './documentPageTypes';

type Props = {
  documentId: string;
  data: DocumentResponse;
  pdfExportLoading: boolean;
  iconSize?: number;
  handleStartPdfExport: () => Promise<void>;
};

async function downloadDocumentPdf(documentId: string, title: string): Promise<void> {
  const res = await apiFetch(`/api/v1/documents/${documentId}/pdf`);
  if (!res.ok) return;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.trim() || 'document'}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

/** PDF download always listed when published (disabled until ready); regenerate only for leads. */
export function DocumentPdfMenuItems({
  documentId,
  data,
  pdfExportLoading,
  iconSize = 14,
  handleStartPdfExport,
}: Props) {
  const { t } = useTranslation('documents');
  const published = data.publishedAt != null;
  if (!published) return null;

  const hasPdf = Boolean(data.pdfUrl?.trim());
  const canRegenerate = Boolean(data.canPublish);

  return (
    <>
      <Menu.Item
        leftSection={<IconDownload size={iconSize} />}
        disabled={!hasPdf}
        onClick={() => {
          if (!hasPdf) return;
          void downloadDocumentPdf(documentId, data.title);
        }}
      >
        {t('documentPage.menu.downloadPdf')}
      </Menu.Item>
      {canRegenerate && (
        <Menu.Item
          leftSection={<IconRefresh size={iconSize} />}
          disabled={pdfExportLoading}
          onClick={() => void handleStartPdfExport()}
        >
          {pdfExportLoading
            ? t('documentPage.menu.exportingPdf')
            : hasPdf
              ? t('documentPage.menu.regeneratePdf')
              : t('documentPage.menu.generatePdf')}
        </Menu.Item>
      )}
    </>
  );
}
