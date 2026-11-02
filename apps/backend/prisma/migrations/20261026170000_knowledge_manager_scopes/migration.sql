-- AlterTable
ALTER TABLE "User" ADD COLUMN "isKnowledgeManager" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "KnowledgeManagerCompany" (
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "KnowledgeManagerCompany_pkey" PRIMARY KEY ("companyId","userId")
);

-- CreateTable
CREATE TABLE "KnowledgeManagerDepartment" (
    "departmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "KnowledgeManagerDepartment_pkey" PRIMARY KEY ("departmentId","userId")
);

-- CreateTable
CREATE TABLE "KnowledgeManagerTeam" (
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "KnowledgeManagerTeam_pkey" PRIMARY KEY ("teamId","userId")
);

-- AddForeignKey
ALTER TABLE "KnowledgeManagerCompany" ADD CONSTRAINT "KnowledgeManagerCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeManagerCompany" ADD CONSTRAINT "KnowledgeManagerCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeManagerDepartment" ADD CONSTRAINT "KnowledgeManagerDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeManagerDepartment" ADD CONSTRAINT "KnowledgeManagerDepartment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeManagerTeam" ADD CONSTRAINT "KnowledgeManagerTeam_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeManagerTeam" ADD CONSTRAINT "KnowledgeManagerTeam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
