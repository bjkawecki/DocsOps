-- CreateEnum
CREATE TYPE "PlatformExportRunStatus" AS ENUM ('queued', 'running', 'packaging', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "PlatformImportRunStatus" AS ENUM (
  'uploaded',
  'preflight_failed',
  'awaiting_confirm',
  'queued',
  'running',
  'importing_organization',
  'importing_users',
  'importing_owners',
  'importing_contexts',
  'importing_documents',
  'importing_versions',
  'importing_tags',
  'importing_grants',
  'importing_pins',
  'importing_comments',
  'importing_suggestions',
  'importing_files',
  'succeeded',
  'failed'
);

-- CreateEnum
CREATE TYPE "PlatformImportRunSource" AS ENUM ('upload');

-- AlterTable
ALTER TABLE "SystemMaintenanceLock" ADD COLUMN "platformImportRunId" TEXT;

-- CreateTable
CREATE TABLE "PlatformExportRun" (
    "id" TEXT NOT NULL,
    "status" "PlatformExportRunStatus" NOT NULL DEFAULT 'queued',
    "triggeredByUserId" TEXT,
    "pgBossJobId" TEXT,
    "archiveSha256" TEXT,
    "sizeBytes" BIGINT,
    "localObjectKey" TEXT,
    "manifestJson" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformExportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformImportRun" (
    "id" TEXT NOT NULL,
    "status" "PlatformImportRunStatus" NOT NULL DEFAULT 'uploaded',
    "source" "PlatformImportRunSource" NOT NULL DEFAULT 'upload',
    "uploadObjectKey" TEXT,
    "triggeredByUserId" TEXT,
    "pgBossJobId" TEXT,
    "preflightJson" JSONB,
    "optionsJson" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPlatformMigrationAudit" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "platformExportRunId" TEXT,
    "platformImportRunId" TEXT,
    "status" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPlatformMigrationAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlatformExportRun_status_createdAt_idx" ON "PlatformExportRun"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PlatformExportRun_createdAt_idx" ON "PlatformExportRun"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "PlatformImportRun_status_createdAt_idx" ON "PlatformImportRun"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PlatformImportRun_createdAt_idx" ON "PlatformImportRun"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "AdminPlatformMigrationAudit_createdAt_idx" ON "AdminPlatformMigrationAudit"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "AdminPlatformMigrationAudit_action_status_createdAt_idx" ON "AdminPlatformMigrationAudit"("action", "status", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "PlatformExportRun" ADD CONSTRAINT "PlatformExportRun_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformImportRun" ADD CONSTRAINT "PlatformImportRun_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminPlatformMigrationAudit" ADD CONSTRAINT "AdminPlatformMigrationAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
