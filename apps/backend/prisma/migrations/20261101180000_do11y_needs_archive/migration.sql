-- Do11y: archive-recommended outcome (parallel to needs_update).
ALTER TABLE "Document" ADD COLUMN "healthCheckNeedsArchive" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Document_healthCheckNeedsArchive_idx" ON "Document"("healthCheckNeedsArchive");
