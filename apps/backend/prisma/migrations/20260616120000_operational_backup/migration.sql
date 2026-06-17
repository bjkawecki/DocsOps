-- CreateEnum
CREATE TYPE "BackupDestinationType" AS ENUM ('S3_COMPATIBLE', 'SSH');

-- CreateEnum
CREATE TYPE "BackupRunStatus" AS ENUM ('queued', 'running', 'uploading', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "BackupRunTriggerSource" AS ENUM ('manual', 'schedule');

-- CreateTable
CREATE TABLE "BackupDestination" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BackupDestinationType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "configJson" JSONB NOT NULL,
    "credentialsCiphertext" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupDestination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "retentionCount" INTEGER NOT NULL DEFAULT 7,
    "defaultDestinationId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupRun" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT,
    "status" "BackupRunStatus" NOT NULL DEFAULT 'queued',
    "triggerSource" "BackupRunTriggerSource" NOT NULL,
    "triggeredByUserId" TEXT,
    "pgBossJobId" TEXT,
    "archiveSha256" TEXT,
    "sizeBytes" BIGINT,
    "remotePath" TEXT,
    "localObjectKey" TEXT,
    "manifestJson" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemMaintenanceLock" (
    "id" TEXT NOT NULL DEFAULT 'backup',
    "reason" TEXT NOT NULL,
    "backupRunId" TEXT,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemMaintenanceLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminBackupActionAudit" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "backupRunId" TEXT,
    "destinationId" TEXT,
    "status" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminBackupActionAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BackupRun_status_createdAt_idx" ON "BackupRun"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "BackupRun_createdAt_idx" ON "BackupRun"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "AdminBackupActionAudit_createdAt_idx" ON "AdminBackupActionAudit"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "AdminBackupActionAudit_action_status_createdAt_idx" ON "AdminBackupActionAudit"("action", "status", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "BackupSettings" ADD CONSTRAINT "BackupSettings_defaultDestinationId_fkey" FOREIGN KEY ("defaultDestinationId") REFERENCES "BackupDestination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupRun" ADD CONSTRAINT "BackupRun_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "BackupDestination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupRun" ADD CONSTRAINT "BackupRun_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminBackupActionAudit" ADD CONSTRAINT "AdminBackupActionAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default settings row
INSERT INTO "BackupSettings" ("id", "retentionCount", "updatedAt")
VALUES ('default', 7, NOW())
ON CONFLICT ("id") DO NOTHING;
