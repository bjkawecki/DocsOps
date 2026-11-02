import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { getAdminJobsHealth } from './adminJobsQueryService.js';
import {
  IN_PROGRESS_PLATFORM_EXPORT_STATUSES,
  IN_PROGRESS_PLATFORM_IMPORT_STATUSES,
  getPublicMaintenanceStatus,
} from '../../../infrastructure/maintenance/maintenanceModeService.js';
import { isMinioAvailableForPlatformMigration } from './platformExportService.js';
import {
  serializePlatformExportRun,
  serializePlatformImportRun,
} from './platformMigrationRunSerialize.js';

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
    activeExportRun: activeExport ? serializePlatformExportRun(activeExport) : null,
    lastExportRun: lastExport ? serializePlatformExportRun(lastExport) : null,
    activeImportRun: activeImport ? serializePlatformImportRun(activeImport) : null,
    lastImportRun: lastImport ? serializePlatformImportRun(lastImport) : null,
  };
}
