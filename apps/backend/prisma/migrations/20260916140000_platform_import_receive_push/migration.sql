-- AlterEnum
ALTER TYPE "PlatformImportRunSource" ADD VALUE 'push';

-- CreateTable
CREATE TABLE "PlatformImportReceiveSlot" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdByUserId" TEXT NOT NULL,
    "platformImportRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformImportReceiveSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformImportReceiveSlot_tokenHash_key" ON "PlatformImportReceiveSlot"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformImportReceiveSlot_platformImportRunId_key" ON "PlatformImportReceiveSlot"("platformImportRunId");

-- CreateIndex
CREATE INDEX "PlatformImportReceiveSlot_expiresAt_idx" ON "PlatformImportReceiveSlot"("expiresAt");

-- CreateIndex
CREATE INDEX "PlatformImportReceiveSlot_usedAt_idx" ON "PlatformImportReceiveSlot"("usedAt");

-- CreateIndex
CREATE INDEX "PlatformImportReceiveSlot_createdAt_idx" ON "PlatformImportReceiveSlot"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "PlatformImportReceiveSlot" ADD CONSTRAINT "PlatformImportReceiveSlot_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformImportReceiveSlot" ADD CONSTRAINT "PlatformImportReceiveSlot_platformImportRunId_fkey" FOREIGN KEY ("platformImportRunId") REFERENCES "PlatformImportRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
