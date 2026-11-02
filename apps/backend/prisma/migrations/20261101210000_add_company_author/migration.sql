-- CreateTable
CREATE TABLE "CompanyAuthor" (
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CompanyAuthor_pkey" PRIMARY KEY ("companyId","userId")
);

-- AddForeignKey
ALTER TABLE "CompanyAuthor" ADD CONSTRAINT "CompanyAuthor_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAuthor" ADD CONSTRAINT "CompanyAuthor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
