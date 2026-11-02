-- CreateEnum
CREATE TYPE "DocumentMoveRequestStatus" AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- CreateTable
CREATE TABLE "DocumentMoveRequest" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fromContextId" TEXT NOT NULL,
    "toContextId" TEXT NOT NULL,
    "fromOwnerId" TEXT NOT NULL,
    "toOwnerId" TEXT NOT NULL,
    "status" "DocumentMoveRequestStatus" NOT NULL DEFAULT 'pending',
    "requestedById" TEXT NOT NULL,
    "decidedById" TEXT,
    "note" TEXT,
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentMoveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentMoveRequest_documentId_status_idx" ON "DocumentMoveRequest"("documentId", "status");

-- CreateIndex
CREATE INDEX "DocumentMoveRequest_toOwnerId_status_idx" ON "DocumentMoveRequest"("toOwnerId", "status");

-- CreateIndex
CREATE INDEX "DocumentMoveRequest_fromOwnerId_status_idx" ON "DocumentMoveRequest"("fromOwnerId", "status");

-- AddForeignKey
ALTER TABLE "DocumentMoveRequest" ADD CONSTRAINT "DocumentMoveRequest_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentMoveRequest" ADD CONSTRAINT "DocumentMoveRequest_fromContextId_fkey" FOREIGN KEY ("fromContextId") REFERENCES "Context"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentMoveRequest" ADD CONSTRAINT "DocumentMoveRequest_toContextId_fkey" FOREIGN KEY ("toContextId") REFERENCES "Context"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentMoveRequest" ADD CONSTRAINT "DocumentMoveRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentMoveRequest" ADD CONSTRAINT "DocumentMoveRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
