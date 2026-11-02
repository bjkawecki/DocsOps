-- AlterTable
ALTER TABLE "Document" ADD COLUMN "draftContributorUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "DocumentVersion" ADD COLUMN "contributorUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
