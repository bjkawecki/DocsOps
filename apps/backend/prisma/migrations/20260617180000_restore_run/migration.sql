-- CreateEnum
CREATE TYPE "RestoreRunStatus" AS ENUM ('queued', 'running', 'validating', 'restoring_db', 'restoring_minio', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "RestoreRunSource" AS ENUM ('history', 'upload');

-- AlterTable
ALTER TABLE "SystemMaintenanceLock" ADD COLUMN "restoreRunId" TEXT;

-- AlterTable
ALTER TABLE "AdminBackupActionAudit" ADD COLUMN "restoreRunId" TEXT;

-- CreateTable
CREATE TABLE "RestoreRun" (
    "id" TEXT NOT NULL,
    "status" "RestoreRunStatus" NOT NULL DEFAULT 'queued',
    "source" "RestoreRunSource" NOT NULL,
    "backupRunId" TEXT,
    "uploadObjectKey" TEXT,
    "triggeredByUserId" TEXT,
    "pgBossJobId" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestoreRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RestoreRun_status_createdAt_idx" ON "RestoreRun"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RestoreRun_createdAt_idx" ON "RestoreRun"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "RestoreRun" ADD CONSTRAINT "RestoreRun_backupRunId_fkey" FOREIGN KEY ("backupRunId") REFERENCES "BackupRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestoreRun" ADD CONSTRAINT "RestoreRun_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
