-- CreateEnum
ALTER TYPE "BackupRunTriggerSource" ADD VALUE 'pre_update';

-- CreateEnum
CREATE TYPE "UpdateRunStatus" AS ENUM ('queued', 'backing_up', 'applying', 'succeeded', 'failed');

-- AlterTable
ALTER TABLE "SystemMaintenanceLock" ADD COLUMN "updateRunId" TEXT;

-- CreateTable
CREATE TABLE "UpdateRun" (
    "id" TEXT NOT NULL,
    "status" "UpdateRunStatus" NOT NULL DEFAULT 'queued',
    "targetVersion" TEXT NOT NULL,
    "targetReleaseTag" TEXT NOT NULL,
    "backupRunId" TEXT,
    "triggeredByUserId" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpdateRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UpdateRun_status_createdAt_idx" ON "UpdateRun"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "UpdateRun_createdAt_idx" ON "UpdateRun"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "UpdateRun" ADD CONSTRAINT "UpdateRun_backupRunId_fkey" FOREIGN KEY ("backupRunId") REFERENCES "BackupRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpdateRun" ADD CONSTRAINT "UpdateRun_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
