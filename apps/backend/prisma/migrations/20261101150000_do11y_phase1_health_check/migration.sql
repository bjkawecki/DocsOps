-- Do11y Phase 1: SystemSettings defaults, Document health-check fields, audit events.

ALTER TABLE "SystemSettings" ADD COLUMN "healthCheckDefaultIntervalDays" INTEGER NOT NULL DEFAULT 90;
ALTER TABLE "SystemSettings" ADD COLUMN "healthCheckAutoScanEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Document" ADD COLUMN "healthCheckIntervalDays" INTEGER;
ALTER TABLE "Document" ADD COLUMN "healthCheckNextAt" TIMESTAMP(3);
ALTER TABLE "Document" ADD COLUMN "healthCheckNeedsUpdate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Document" ADD COLUMN "healthCheckSnoozedUntil" TIMESTAMP(3);
ALTER TABLE "Document" ADD COLUMN "healthCheckLastDecision" TEXT;
ALTER TABLE "Document" ADD COLUMN "healthCheckLastDecisionAt" TIMESTAMP(3);
ALTER TABLE "Document" ADD COLUMN "healthCheckLastDecisionById" TEXT;

CREATE TABLE "DocumentHealthCheckEvent" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "decision" TEXT NOT NULL,
    "nextAt" TIMESTAMP(3),
    "snoozedUntil" TIMESTAMP(3),
    "intervalDays" INTEGER,
    "note" TEXT,

    CONSTRAINT "DocumentHealthCheckEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Document_healthCheckNextAt_idx" ON "Document"("healthCheckNextAt");
CREATE INDEX "Document_healthCheckNeedsUpdate_idx" ON "Document"("healthCheckNeedsUpdate");
CREATE INDEX "DocumentHealthCheckEvent_documentId_at_idx" ON "DocumentHealthCheckEvent"("documentId", "at");
CREATE INDEX "DocumentHealthCheckEvent_actorUserId_idx" ON "DocumentHealthCheckEvent"("actorUserId");

ALTER TABLE "Document" ADD CONSTRAINT "Document_healthCheckLastDecisionById_fkey" FOREIGN KEY ("healthCheckLastDecisionById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentHealthCheckEvent" ADD CONSTRAINT "DocumentHealthCheckEvent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentHealthCheckEvent" ADD CONSTRAINT "DocumentHealthCheckEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
