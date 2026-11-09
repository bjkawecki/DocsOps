import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { PrismaClient } from '../../../../../generated/prisma/client.js';
import { enqueueJob } from '../../../../infrastructure/jobs/client.js';
import { renderAndStoreDocumentPdf } from '../../../../infrastructure/jobs/documentPdfExportJob.js';
import type { JobPayloadByType } from '../../../../infrastructure/jobs/jobTypes.js';
import { initStorage, type StorageService } from '../../../../infrastructure/storage/index.js';
import { listPublishedDocumentsForOwnerScope } from './listPublishedScopeDocuments.js';
import { buildScopePdfArchiveFileName, buildScopePdfRelativePath } from './scopePdfExportPath.js';
import {
  SCOPE_PDF_EXPORT_RETENTION_PER_USER,
  type ScopePdfOwnerRef,
  type ScopePdfOwnerRefIds,
} from './scopePdfExportTypes.js';

const execFileAsync = promisify(execFile);

type JobLogger = {
  info: (obj: unknown, msg?: string) => void;
  warn: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
};

async function readableToFile(body: NodeJS.ReadableStream, destPath: string): Promise<void> {
  await mkdir(dirname(destPath), { recursive: true });
  await pipeline(body, createWriteStream(destPath));
}

export function normalizeScopePdfExportErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.startsWith('SCOPE_PDF_EXPORT_')) {
    return error.message;
  }
  const raw = error instanceof Error ? error.message : String(error);
  if (/spawn zip ENOENT|zip.*ENOENT|ENOENT.*zip/i.test(raw)) {
    return 'SCOPE_PDF_EXPORT_ZIP_NOT_FOUND';
  }
  return raw;
}

async function notifyRequester(
  prisma: PrismaClient,
  userId: string,
  eventType: 'scope-pdf-export-succeeded' | 'scope-pdf-export-failed',
  payload: Record<string, unknown>
): Promise<void> {
  await enqueueJob('notifications.send', {
    eventType,
    targetUserIds: [userId],
    payload,
  });
}

function ownerRefFromRun(run: {
  ownerCompanyId: string | null;
  ownerDepartmentId: string | null;
  ownerTeamId: string | null;
}): ScopePdfOwnerRefIds | null {
  if (run.ownerCompanyId) return { kind: 'company', companyId: run.ownerCompanyId };
  if (run.ownerDepartmentId) return { kind: 'department', departmentId: run.ownerDepartmentId };
  if (run.ownerTeamId) return { kind: 'team', teamId: run.ownerTeamId };
  return null;
}

async function loadOwnerRef(
  prisma: PrismaClient,
  partial: ScopePdfOwnerRefIds
): Promise<ScopePdfOwnerRef | null> {
  if (partial.kind === 'company') {
    const company = await prisma.company.findUnique({
      where: { id: partial.companyId },
      select: { name: true },
    });
    if (!company) return null;
    return { kind: 'company', companyId: partial.companyId, scopeName: company.name };
  }
  if (partial.kind === 'department') {
    const department = await prisma.department.findUnique({
      where: { id: partial.departmentId },
      select: { name: true },
    });
    if (!department) return null;
    return {
      kind: 'department',
      departmentId: partial.departmentId,
      scopeName: department.name,
    };
  }
  const team = await prisma.team.findUnique({
    where: { id: partial.teamId },
    select: { name: true },
  });
  if (!team) return null;
  return { kind: 'team', teamId: partial.teamId, scopeName: team.name };
}

async function applyRetention(
  prisma: PrismaClient,
  storage: StorageService,
  userId: string
): Promise<void> {
  const runs = await prisma.scopePdfExportRun.findMany({
    where: { triggeredByUserId: userId, status: 'succeeded' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, localObjectKey: true },
  });
  const toDelete = runs.slice(SCOPE_PDF_EXPORT_RETENTION_PER_USER);
  for (const run of toDelete) {
    if (run.localObjectKey) {
      await storage.deleteObject(run.localObjectKey).catch(() => undefined);
    }
    await prisma.scopePdfExportRun.delete({ where: { id: run.id } }).catch(() => undefined);
  }
}

export async function runScopePdfExport(
  payload: JobPayloadByType['documents.scope-pdf-export'],
  context: { prisma: PrismaClient; logger: JobLogger }
): Promise<void> {
  const { prisma, logger } = context;
  const runId = payload.runId;
  let workDir: string | null = null;

  const run = await prisma.scopePdfExportRun.findUnique({ where: { id: runId } });
  if (!run) {
    logger.warn({ runId }, 'Scope PDF export run missing');
    return;
  }

  try {
    const storage = await initStorage();
    if (!storage?.isAvailable()) {
      throw new Error('MinIO is not configured or unreachable');
    }

    await prisma.scopePdfExportRun.update({
      where: { id: runId },
      data: { status: 'running', startedAt: new Date(), errorMessage: null },
    });

    const partial = ownerRefFromRun(run);
    if (!partial) throw new Error('SCOPE_PDF_EXPORT_INVALID_OWNER');
    const owner = await loadOwnerRef(prisma, partial);
    if (!owner) throw new Error('SCOPE_PDF_EXPORT_OWNER_NOT_FOUND');

    const listed = await listPublishedDocumentsForOwnerScope(prisma, owner);
    await prisma.scopePdfExportRun.update({
      where: { id: runId },
      data: { docsTotal: listed.length },
    });

    workDir = await mkdtemp(join(tmpdir(), 'docsops-scope-pdf-'));
    const treeRoot = join(workDir, 'archive');
    await mkdir(treeRoot, { recursive: true });

    let docsOk = 0;
    let docsFailed = 0;

    for (const doc of listed) {
      const relativePath = buildScopePdfRelativePath({
        ownerKind: doc.ownerKind,
        scopeName: doc.scopeName,
        contextKind: doc.contextKind,
        contextName: doc.contextName,
        subcontextName: doc.subcontextName,
        documentTitle: doc.title,
        documentId: doc.documentId,
      });
      const absolutePdfPath = join(treeRoot, relativePath);

      try {
        let objectKey = doc.pdfObjectKey;
        if (!objectKey) {
          objectKey = await renderAndStoreDocumentPdf(
            { documentId: doc.documentId, versionId: doc.versionId, locale: 'en' },
            context
          );
        }
        const object = await storage.getObject(objectKey);
        if (!object) {
          throw new Error(`PDF object missing: ${objectKey}`);
        }
        await readableToFile(object.Body, absolutePdfPath);
        docsOk += 1;
      } catch (error) {
        docsFailed += 1;
        logger.warn(
          { documentId: doc.documentId, error },
          'Scope PDF export: skipped document after failure'
        );
      }
    }

    const archiveName = buildScopePdfArchiveFileName(owner.kind);
    const archivePath = join(workDir, archiveName);
    try {
      await execFileAsync('zip', ['-r', '-q', archivePath, '.'], { cwd: treeRoot });
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        throw new Error('SCOPE_PDF_EXPORT_ZIP_NOT_FOUND', { cause: error });
      }
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`SCOPE_PDF_EXPORT_ZIP_FAILED: ${detail}`, { cause: error });
    }

    const archiveBytes = await readFile(archivePath);
    const archiveSha = createHash('sha256').update(archiveBytes).digest('hex');
    const localKey = `scope-pdf-export/${runId}/${archiveName}`;
    await storage.uploadFilePath(localKey, archivePath, 'application/zip');

    await prisma.scopePdfExportRun.update({
      where: { id: runId },
      data: {
        status: 'succeeded',
        archiveSha256: archiveSha,
        sizeBytes: BigInt(archiveBytes.length),
        localObjectKey: localKey,
        docsOk,
        docsFailed,
        finishedAt: new Date(),
        errorMessage: null,
      },
    });

    await applyRetention(prisma, storage, run.triggeredByUserId);

    await notifyRequester(prisma, run.triggeredByUserId, 'scope-pdf-export-succeeded', {
      scopePdfExportRunId: runId,
      sizeBytes: archiveBytes.length,
      docsOk,
      docsFailed,
      docsTotal: listed.length,
      downloadPath: `/api/v1/scope-pdf-exports/${runId}/download`,
      scopeKind: owner.kind,
      scopeName: owner.scopeName,
    });

    logger.info(
      { runId, docsOk, docsFailed, sizeBytes: archiveBytes.length },
      'Scope PDF export completed'
    );
  } catch (error) {
    const message = normalizeScopePdfExportErrorMessage(error);
    const failedPartial = ownerRefFromRun(run);
    const failedOwner =
      failedPartial != null ? await loadOwnerRef(prisma, failedPartial).catch(() => null) : null;
    await prisma.scopePdfExportRun
      .update({
        where: { id: runId },
        data: {
          status: 'failed',
          errorMessage: message,
          finishedAt: new Date(),
        },
      })
      .catch(() => undefined);
    await notifyRequester(prisma, run.triggeredByUserId, 'scope-pdf-export-failed', {
      scopePdfExportRunId: runId,
      errorMessage: message,
      ...(failedOwner ? { scopeKind: failedOwner.kind, scopeName: failedOwner.scopeName } : {}),
    }).catch(() => undefined);
    logger.error({ error, runId }, 'Scope PDF export failed');
    throw error;
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}

export async function isMinioAvailableForScopePdfExport(): Promise<boolean> {
  try {
    const storage = await initStorage();
    if (!storage) return false;
    return storage.isAvailable();
  } catch {
    return false;
  }
}
