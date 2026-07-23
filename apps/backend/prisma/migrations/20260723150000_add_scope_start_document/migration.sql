-- AlterTable
ALTER TABLE "Company" ADD COLUMN "startDocumentId" TEXT;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN "startDocumentId" TEXT;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN "startDocumentId" TEXT;

-- CreateIndex
CREATE INDEX "Company_startDocumentId_idx" ON "Company"("startDocumentId");

-- CreateIndex
CREATE INDEX "Department_startDocumentId_idx" ON "Department"("startDocumentId");

-- CreateIndex
CREATE INDEX "Team_startDocumentId_idx" ON "Team"("startDocumentId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_startDocumentId_fkey" FOREIGN KEY ("startDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_startDocumentId_fkey" FOREIGN KEY ("startDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_startDocumentId_fkey" FOREIGN KEY ("startDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
