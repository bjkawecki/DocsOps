import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import type { AttachmentsMap } from './exportDomainData.js';
import type { ImportContext, ImportPhaseUpdater } from './importDomainData.js';

async function readJson<T>(path: string): Promise<T> {
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as T;
}

/** Uploads exported PDF renders and attachments to storage, linking them to imported documents. */
export async function importAttachmentFiles(
  ctx: ImportContext,
  onPhase: ImportPhaseUpdater
): Promise<void> {
  const { prisma, storage, idMap } = ctx;

  const attachmentsMap = await readJson<AttachmentsMap>(
    join(ctx.bundleDir, 'attachments-map.json')
  );

  await onPhase('importing_files');

  for (const [docExportId, files] of Object.entries(attachmentsMap.documents)) {
    const documentId = idMap.getOrThrow(docExportId);
    for (const file of files) {
      const sourcePath = join(ctx.bundleDir, file.fileRef);
      const ext = extname(file.filename) || extname(file.fileRef) || '';

      if (file.kind === 'pdf') {
        const objectKey = `exports/documents/${documentId}/${Date.now()}-import.pdf`;
        await storage.uploadStream(
          objectKey,
          createReadStream(sourcePath),
          file.contentType ?? 'application/pdf'
        );
        await prisma.document.update({
          where: { id: documentId },
          data: { pdfUrl: objectKey },
        });
      } else {
        const created = await prisma.documentAttachment.create({
          data: {
            documentId,
            objectKey: '',
            filename: file.filename,
            contentType: file.contentType,
            sizeBytes: file.sizeBytes,
            uploadedById: null,
          },
        });
        const objectKey = `attachments/${documentId}/${created.id}${ext}`;
        await storage.uploadStream(
          objectKey,
          createReadStream(sourcePath),
          file.contentType ?? undefined
        );
        await prisma.documentAttachment.update({
          where: { id: created.id },
          data: { objectKey },
        });
      }
    }
  }
}
