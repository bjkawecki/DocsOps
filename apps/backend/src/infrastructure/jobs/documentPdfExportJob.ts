import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';
import { canRead } from '../../domains/documents/permissions/canRead.js';
import { blockDocumentV0ToMarkdown } from '../../domains/documents/services/blocks/blocksToMarkdown.js';
import { parseBlockDocumentFromDb } from '../../domains/documents/services/blocks/documentBlocksBackfill.js';
import {
  collectAttachmentIdsFromMarkdown,
  extensionFromFilename,
  rewriteAttachmentTokensForPdf,
} from '../../domains/documents/services/blocks/pdfAttachmentMarkdown.js';
import {
  getCompanyPdfBrandingRow,
  resolvePdfBrandingCompanyIdForDocument,
} from '../../domains/organisation/services/companyPdfBrandingService.js';
import {
  buildPdfResponsibleMetaLine,
  resolveDocumentPdfResponsibleNames,
  resolvePdfMetaLocale,
} from '../pdf/pdfExportMeta.js';
import { applyPdfWriteProtection } from '../pdf/pdfWriteProtect.js';
import { renderMarkdownToPdfBuffer, themeFromCompanyRow } from '../pdf/typstPdfExport.js';
import type { PrismaClient } from '../../../generated/prisma/client.js';
import { initStorage, type StorageService } from '../storage/index.js';
import type { JobPayloadByType } from './jobTypes.js';

type JobLogger = {
  info: (obj: unknown, msg?: string) => void;
  warn: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
};

type JobContext = {
  prisma: PrismaClient;
  logger: JobLogger;
};

async function readableToBuffer(body: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    if (Buffer.isBuffer(chunk)) {
      chunks.push(chunk);
    } else if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
    } else {
      chunks.push(Buffer.from(chunk as Uint8Array));
    }
  }
  return Buffer.concat(chunks);
}

let storagePromise: Promise<StorageService | null> | null = null;

async function getStorage(): Promise<StorageService | null> {
  if (storagePromise == null) {
    storagePromise = initStorage();
  }
  return storagePromise;
}

/** Render a published version to PDF, write-protect, store on DocumentVersion + Document.pdfUrl. */
export async function exportDocumentToPdf(
  payload: JobPayloadByType['documents.export.pdf'],
  context: JobContext
): Promise<void> {
  const canExport = await canRead(context.prisma, payload.requestedByUserId, payload.documentId);
  if (!canExport) {
    throw new Error('Permission denied for PDF export');
  }

  const version = await context.prisma.documentVersion.findFirst({
    where: { id: payload.versionId, documentId: payload.documentId },
    select: {
      id: true,
      versionNumber: true,
      blocks: true,
      createdAt: true,
      document: { select: { id: true, title: true, deletedAt: true } },
    },
  });
  if (!version || version.document.deletedAt != null) {
    throw new Error('Document version not found');
  }

  const parsed = parseBlockDocumentFromDb(version.blocks);
  if (!parsed) {
    throw new Error('Document version has no exportable blocks');
  }
  const markdownBody = blockDocumentV0ToMarkdown(parsed);

  const storage = await getStorage();
  if (!storage) {
    throw new Error('Storage not available');
  }

  const attachmentIds = collectAttachmentIdsFromMarkdown(markdownBody);
  const relativePathById = new Map<string, string>();
  const assetFiles: { relativePath: string; data: Buffer }[] = [];

  for (const attachmentId of attachmentIds) {
    const attachment = await context.prisma.documentAttachment.findFirst({
      where: { id: attachmentId, documentId: version.document.id },
      select: { id: true, objectKey: true, filename: true },
    });
    if (!attachment) {
      throw new Error(`Attachment not found for PDF export: ${attachmentId}`);
    }
    const object = await storage.getObject(attachment.objectKey);
    if (!object) {
      throw new Error(`Attachment object missing in storage: ${attachmentId}`);
    }
    const ext = extensionFromFilename(attachment.filename) || '.bin';
    const relativePath = `attachments/${attachment.id}${ext}`;
    relativePathById.set(attachment.id, relativePath);
    assetFiles.push({
      relativePath,
      data: await readableToBuffer(object.Body),
    });
  }

  const markdownForPdf = rewriteAttachmentTokensForPdf(markdownBody, relativePathById);
  const responsibleNames = await resolveDocumentPdfResponsibleNames(
    context.prisma,
    version.document.id
  );
  const responsibleLabel = responsibleNames.join(', ');
  let metaLocale = payload.locale;
  if (metaLocale !== 'de' && metaLocale !== 'en') {
    const requester = await context.prisma.user.findUnique({
      where: { id: payload.requestedByUserId },
      select: { preferences: true },
    });
    metaLocale = resolvePdfMetaLocale(requester?.preferences);
  }
  const metaLine = buildPdfResponsibleMetaLine({
    responsibleNames,
    versionNumber: version.versionNumber,
    publishedAt: version.createdAt,
    locale: metaLocale,
  });

  const brandingCompanyId = await resolvePdfBrandingCompanyIdForDocument(
    context.prisma,
    version.document.id
  );
  const brandingRow =
    brandingCompanyId != null
      ? await getCompanyPdfBrandingRow(context.prisma, brandingCompanyId)
      : null;
  const theme = themeFromCompanyRow(brandingRow);
  if (theme.logoObjectKey != null && theme.logoRelativePath != null) {
    const logoObject = await storage.getObject(theme.logoObjectKey);
    if (logoObject) {
      assetFiles.push({
        relativePath: theme.logoRelativePath,
        data: await readableToBuffer(logoObject.Body),
      });
    }
  }

  let pdfBuffer = await renderMarkdownToPdfBuffer({
    markdown: markdownForPdf,
    title: version.document.title,
    metaLine,
    assetFiles,
    theme,
  });
  pdfBuffer = await applyPdfWriteProtection(pdfBuffer);

  const objectKey = `exports/documents/${version.document.id}/v${version.versionNumber}-${randomUUID()}.pdf`;
  await storage.uploadStream(objectKey, pdfBuffer, 'application/pdf');

  await context.prisma.$transaction([
    context.prisma.documentVersion.update({
      where: { id: version.id },
      data: {
        pdfObjectKey: objectKey,
        pdfResponsibleLabel: responsibleLabel.length > 0 ? responsibleLabel : null,
      },
    }),
    context.prisma.document.update({
      where: { id: version.document.id },
      data: { pdfUrl: objectKey },
    }),
  ]);

  context.logger.info(
    { documentId: version.document.id, versionId: version.id, objectKey },
    'Stored version PDF and updated document.pdfUrl'
  );
}
