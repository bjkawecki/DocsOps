-- AlterTable
ALTER TABLE "Document" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DocumentView" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_viewCount_idx" ON "Document"("viewCount");

-- CreateIndex
CREATE INDEX "DocumentView_documentId_idx" ON "DocumentView"("documentId");

-- CreateIndex
CREATE INDEX "DocumentView_userId_idx" ON "DocumentView"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentView_documentId_userId_viewedOn_key" ON "DocumentView"("documentId", "userId", "viewedOn");

-- AddForeignKey
ALTER TABLE "DocumentView" ADD CONSTRAINT "DocumentView_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentView" ADD CONSTRAINT "DocumentView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
