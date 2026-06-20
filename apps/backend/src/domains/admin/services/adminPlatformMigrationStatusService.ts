import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { getAdminJobsHealth } from './adminJobsQueryService.js';
import {
  IN_PROGRESS_PLATFORM_EXPORT_STATUSES,
  IN_PROGRESS_PLATFORM_IMPORT_STATUSES,
  getPublicMaintenanceStatus,
} from '../../../infrastructure/maintenance/maintenanceModeService.js';
import { isMinioAvailableForPlatformMigration } from './platformExportService.js';

function serializeExportRun(run: {
  id: string;
  status: string;
  triggeredByUserId: string | null;
  archiveSha256: string | null;
  sizeBytes: bigint | null;
  localObjectKey: string | null;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  manifestJson: unknown;
}) {
  return {
    id: run.id,
    status: run.status,
    triggeredByUserId: run.triggeredByUserId,
    archiveSha256: run.archiveSha256,
    sizeBytes: run.sizeBytes != null ? Number(run.sizeBytes) : null,
    localObjectKey: run.localObjectKey,
    errorMessage: run.errorMessage,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    createdAt: run.createdAt,
    manifestJson: run.manifestJson,
  };
}

function serializeImportRun(run: {
  id: string;
  status: string;
  source: string;
  uploadObjectKey: string | null;
  triggeredByUserId: string | null;
  preflightJson: unknown;
  optionsJson: unknown;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: run.id,
    status: run.status,
    source: run.source,
    uploadObjectKey: run.uploadObjectKey,
    triggeredByUserId: run.triggeredByUserId,
    preflightJson: run.preflightJson,
    optionsJson: run.optionsJson,
    errorMessage: run.errorMessage,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    createdAt: run.createdAt,
  };
}

export async function getPlatformMigrationStatus(prisma: PrismaClient) {
  const [
    minioAvailable,
    health,
    maintenance,
    activeExport,
    lastExport,
    activeImport,
    lastImport,
    companyCount,
    documentCount,
    userCount,
    departmentCount,
    teamCount,
    contextCount,
    processCount,
    projectCount,
    subcontextCount,
    attachmentFileCount,
  ] = await Promise.all([
    isMinioAvailableForPlatformMigration(),
    getAdminJobsHealth(prisma),
    getPublicMaintenanceStatus(prisma),
    prisma.platformExportRun.findFirst({
      where: { status: { in: [...IN_PROGRESS_PLATFORM_EXPORT_STATUSES] } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.platformExportRun.findFirst({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.platformImportRun.findFirst({
      where: { status: { in: [...IN_PROGRESS_PLATFORM_IMPORT_STATUSES] } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.platformImportRun.findFirst({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.company.count(),
    prisma.document.count(),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.department.count(),
    prisma.team.count(),
    prisma.context.count(),
    prisma.process.count(),
    prisma.project.count(),
    prisma.subcontext.count(),
    prisma.documentAttachment.count(),
  ]);

  const instanceEmpty = companyCount === 0 && documentCount === 0;
  const configuredCompanyCount = companyCount > 0 ? 1 : 0;

  return {
    minioAvailable,
    workerConnected: health.workerConnected,
    maintenanceActive: maintenance.active,
    maintenanceReason: maintenance.reason ?? null,
    instanceEmpty,
    instanceCounts: {
      companies: configuredCompanyCount,
      departments: departmentCount,
      teams: teamCount,
      users: userCount,
      contexts: contextCount,
      processes: processCount,
      projects: projectCount,
      subcontexts: subcontextCount,
      documents: documentCount,
      attachmentFiles: attachmentFileCount,
    },
    activeExportRun: activeExport ? serializeExportRun(activeExport) : null,
    lastExportRun: lastExport ? serializeExportRun(lastExport) : null,
    activeImportRun: activeImport ? serializeImportRun(activeImport) : null,
    lastImportRun: lastImport ? serializeImportRun(lastImport) : null,
  };
}
