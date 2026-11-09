-- CreateEnum
CREATE TYPE "PdfCorpusRunStatus" AS ENUM ('queued', 'running', 'uploading', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "PdfCorpusRunTriggerSource" AS ENUM ('manual', 'schedule');

-- CreateTable
CREATE TABLE "PdfCorpusSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "retentionCount" INTEGER NOT NULL DEFAULT 5,
    "destinationId" TEXT,
    "autoConfigured" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PdfCorpusSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdfCorpusRun" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT,
    "status" "PdfCorpusRunStatus" NOT NULL DEFAULT 'queued',
    "triggerSource" "PdfCorpusRunTriggerSource" NOT NULL,
    "triggeredByUserId" TEXT,
    "pgBossJobId" TEXT,
    "archiveSha256" TEXT,
    "sizeBytes" BIGINT,
    "remotePath" TEXT,
    "localObjectKey" TEXT,
    "docsOk" INTEGER NOT NULL DEFAULT 0,
    "docsFailed" INTEGER NOT NULL DEFAULT 0,
    "docsTotal" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PdfCorpusRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PdfCorpusRun_status_createdAt_idx" ON "PdfCorpusRun"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PdfCorpusRun_createdAt_idx" ON "PdfCorpusRun"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "PdfCorpusSettings" ADD CONSTRAINT "PdfCorpusSettings_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "BackupDestination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdfCorpusRun" ADD CONSTRAINT "PdfCorpusRun_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "BackupDestination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PdfCorpusRun" ADD CONSTRAINT "PdfCorpusRun_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
