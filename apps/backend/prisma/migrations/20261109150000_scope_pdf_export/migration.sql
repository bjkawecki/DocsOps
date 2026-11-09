-- Drop admin PDF corpus archive; introduce lead scope PDF export runs.

DROP TABLE IF EXISTS "PdfCorpusRun";
DROP TABLE IF EXISTS "PdfCorpusSettings";
DROP TYPE IF EXISTS "PdfCorpusRunStatus";
DROP TYPE IF EXISTS "PdfCorpusRunTriggerSource";

CREATE TYPE "ScopePdfExportRunStatus" AS ENUM ('queued', 'running', 'succeeded', 'failed');

CREATE TABLE "ScopePdfExportRun" (
    "id" TEXT NOT NULL,
    "status" "ScopePdfExportRunStatus" NOT NULL DEFAULT 'queued',
    "triggeredByUserId" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "ownerCompanyId" TEXT,
    "ownerDepartmentId" TEXT,
    "ownerTeamId" TEXT,
    "pgBossJobId" TEXT,
    "archiveSha256" TEXT,
    "sizeBytes" BIGINT,
    "localObjectKey" TEXT,
    "docsOk" INTEGER NOT NULL DEFAULT 0,
    "docsFailed" INTEGER NOT NULL DEFAULT 0,
    "docsTotal" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScopePdfExportRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ScopePdfExportRun_triggeredByUserId_createdAt_idx" ON "ScopePdfExportRun"("triggeredByUserId", "createdAt" DESC);
CREATE INDEX "ScopePdfExportRun_status_createdAt_idx" ON "ScopePdfExportRun"("status", "createdAt" DESC);
CREATE INDEX "ScopePdfExportRun_createdAt_idx" ON "ScopePdfExportRun"("createdAt" DESC);

ALTER TABLE "ScopePdfExportRun" ADD CONSTRAINT "ScopePdfExportRun_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
