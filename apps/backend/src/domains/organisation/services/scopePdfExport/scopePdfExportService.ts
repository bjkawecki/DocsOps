import type { PrismaClient } from '../../../../../generated/prisma/client.js';
import { canWriteContext } from '../../permissions/contextPermissions.js';
import { enqueueJob } from '../../../../infrastructure/jobs/client.js';
import { initStorage } from '../../../../infrastructure/storage/index.js';
import { resolveOrgOwnerForContext } from './scopePdfExportOwner.js';
import { isMinioAvailableForScopePdfExport } from './scopePdfExportJobService.js';
import { scopePdfArchiveFileNameFromObjectKey } from './scopePdfExportPath.js';
import { SCOPE_PDF_EXPORT_DOWNLOAD_ERRORS } from './scopePdfExportDownloadErrors.js';
import type { ScopePdfOwnerRef } from './scopePdfExportTypes.js';

function ownerCreateData(owner: ScopePdfOwnerRef) {
  if (owner.kind === 'company') {
    return {
      ownerCompanyId: owner.companyId,
      ownerDepartmentId: null,
      ownerTeamId: null,
    };
  }
  if (owner.kind === 'department') {
    return {
      ownerCompanyId: null,
      ownerDepartmentId: owner.departmentId,
      ownerTeamId: null,
    };
  }
  return {
    ownerCompanyId: null,
    ownerDepartmentId: null,
    ownerTeamId: owner.teamId,
  };
}

export type TriggerScopePdfExportResult =
  { ok: true; runId: string; jobId: string } | { ok: false; status: number; error: string };

export async function triggerScopePdfExport(
  prisma: PrismaClient,
  args: { contextId: string; userId: string }
): Promise<TriggerScopePdfExportResult> {
  const allowed = await canWriteContext(prisma, args.userId, args.contextId);
  if (!allowed) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  const owner = await resolveOrgOwnerForContext(prisma, args.contextId);
  if (!owner) {
    return {
      ok: false,
      status: 400,
      error: 'PDF export is only available for organisation contexts',
    };
  }

  const minioOk = await isMinioAvailableForScopePdfExport();
  if (!minioOk) {
    return { ok: false, status: 503, error: 'Object storage is not available' };
  }

  const run = await prisma.scopePdfExportRun.create({
    data: {
      status: 'queued',
      triggeredByUserId: args.userId,
      contextId: args.contextId,
      ...ownerCreateData(owner),
    },
  });

  const jobId = await enqueueJob('documents.scope-pdf-export', { runId: run.id });
  await prisma.scopePdfExportRun.update({
    where: { id: run.id },
    data: { pgBossJobId: jobId },
  });

  return { ok: true, runId: run.id, jobId };
}

export async function getScopePdfExportRunForUser(
  prisma: PrismaClient,
  runId: string,
  userId: string
) {
  const run = await prisma.scopePdfExportRun.findUnique({ where: { id: runId } });
  if (!run) return null;
  if (run.triggeredByUserId !== userId) return null;
  return run;
}

export function serializeScopePdfExportRun(
  run: NonNullable<Awaited<ReturnType<typeof getScopePdfExportRunForUser>>>
) {
  const scopeKind = run.ownerCompanyId
    ? ('company' as const)
    : run.ownerDepartmentId
      ? ('department' as const)
      : run.ownerTeamId
        ? ('team' as const)
        : null;
  return {
    id: run.id,
    status: run.status,
    contextId: run.contextId,
    scopeKind,
    docsOk: run.docsOk,
    docsFailed: run.docsFailed,
    docsTotal: run.docsTotal,
    sizeBytes: run.sizeBytes != null ? Number(run.sizeBytes) : null,
    errorMessage: run.errorMessage,
    startedAt: run.startedAt?.toISOString() ?? null,
    finishedAt: run.finishedAt?.toISOString() ?? null,
    createdAt: run.createdAt.toISOString(),
    downloadUrl:
      run.status === 'succeeded' && run.localObjectKey
        ? `/api/v1/scope-pdf-exports/${run.id}/download`
        : null,
  };
}

export async function getScopePdfExportDownload(
  prisma: PrismaClient,
  runId: string,
  userId: string
): Promise<
  { ok: true; objectKey: string; fileName: string } | { ok: false; status: number; error: string }
> {
  const run = await getScopePdfExportRunForUser(prisma, runId, userId);
  if (!run) {
    return { ok: false, status: 404, error: SCOPE_PDF_EXPORT_DOWNLOAD_ERRORS.NOT_FOUND };
  }
  if (run.status !== 'succeeded' || !run.localObjectKey) {
    return { ok: false, status: 409, error: SCOPE_PDF_EXPORT_DOWNLOAD_ERRORS.NOT_READY };
  }
  const storage = await initStorage();
  if (!storage?.isAvailable()) {
    return {
      ok: false,
      status: 503,
      error: SCOPE_PDF_EXPORT_DOWNLOAD_ERRORS.STORAGE_UNAVAILABLE,
    };
  }
  return {
    ok: true,
    objectKey: run.localObjectKey,
    fileName: scopePdfArchiveFileNameFromObjectKey(run.localObjectKey),
  };
}
