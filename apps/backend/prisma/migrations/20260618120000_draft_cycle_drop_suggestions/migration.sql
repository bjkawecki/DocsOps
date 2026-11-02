-- ADR 003: Draft change log; remove DocumentSuggestion.

DROP TABLE IF EXISTS "DocumentSuggestion";

DROP TYPE IF EXISTS "DocumentSuggestionStatus";

CREATE TABLE "DocumentDraftCycle" (
    "documentId" TEXT NOT NULL,
    "baseBlocks" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentDraftCycle_pkey" PRIMARY KEY ("documentId")
);

CREATE TABLE "DocumentDraftChange" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "revisionFrom" INTEGER NOT NULL,
    "revisionTo" INTEGER NOT NULL,
    "savedById" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ops" JSONB NOT NULL,
    "affectedBlockIds" TEXT[],

    CONSTRAINT "DocumentDraftChange_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocumentDraftChange_documentId_savedAt_idx" ON "DocumentDraftChange"("documentId", "savedAt");

ALTER TABLE "DocumentDraftCycle" ADD CONSTRAINT "DocumentDraftCycle_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DocumentDraftChange" ADD CONSTRAINT "DocumentDraftChange_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DocumentDraftChange" ADD CONSTRAINT "DocumentDraftChange_savedById_fkey" FOREIGN KEY ("savedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
