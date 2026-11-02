-- AlterTable
ALTER TABLE "Document" ADD COLUMN "documentTypeKey" TEXT;

-- CreateIndex
CREATE INDEX "Document_documentTypeKey_idx" ON "Document"("documentTypeKey");

-- CreateTable
CREATE TABLE "CustomDocumentType" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "whenToUse" TEXT NOT NULL,
    "oftenUsedIn" TEXT,
    "deLabel" TEXT,
    "companyId" TEXT,
    "departmentId" TEXT,
    "teamId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CustomDocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomDocumentTemplate" (
    "id" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "exampleTitle" TEXT NOT NULL,
    "whenToUse" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomDocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomDocumentType_companyId_idx" ON "CustomDocumentType"("companyId");

-- CreateIndex
CREATE INDEX "CustomDocumentType_departmentId_idx" ON "CustomDocumentType"("departmentId");

-- CreateIndex
CREATE INDEX "CustomDocumentType_teamId_idx" ON "CustomDocumentType"("teamId");

-- CreateIndex
CREATE INDEX "CustomDocumentTemplate_typeId_idx" ON "CustomDocumentTemplate"("typeId");

-- AddForeignKey
ALTER TABLE "CustomDocumentType" ADD CONSTRAINT "CustomDocumentType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDocumentType" ADD CONSTRAINT "CustomDocumentType_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDocumentType" ADD CONSTRAINT "CustomDocumentType_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDocumentType" ADD CONSTRAINT "CustomDocumentType_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDocumentTemplate" ADD CONSTRAINT "CustomDocumentTemplate_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "CustomDocumentType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
