-- CreateTable
CREATE TABLE "TeamAuthor" (
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TeamAuthor_pkey" PRIMARY KEY ("teamId","userId")
);

-- CreateTable
CREATE TABLE "DepartmentAuthor" (
    "departmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "DepartmentAuthor_pkey" PRIMARY KEY ("departmentId","userId")
);

-- AddForeignKey
ALTER TABLE "TeamAuthor" ADD CONSTRAINT "TeamAuthor_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamAuthor" ADD CONSTRAINT "TeamAuthor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentAuthor" ADD CONSTRAINT "DepartmentAuthor_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentAuthor" ADD CONSTRAINT "DepartmentAuthor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Promote existing document write grants to team authors where user is team member of owner team
INSERT INTO "TeamAuthor" ("teamId", "userId")
SELECT DISTINCT o."teamId", dgu."userId"
FROM "DocumentGrantUser" dgu
JOIN "Document" d ON d."id" = dgu."documentId"
JOIN "Context" c ON c."id" = d."contextId"
LEFT JOIN "Process" p ON p."contextId" = c."id"
LEFT JOIN "Project" pr ON pr."contextId" = c."id"
LEFT JOIN "Subcontext" sc ON sc."contextId" = c."id"
LEFT JOIN "Project" spr ON spr."id" = sc."projectId"
JOIN "Owner" o ON o."id" = COALESCE(p."ownerId", pr."ownerId", spr."ownerId")
JOIN "TeamMember" tm ON tm."teamId" = o."teamId" AND tm."userId" = dgu."userId"
WHERE dgu."role" = 'Write'
  AND o."teamId" IS NOT NULL
  AND o."ownerUserId" IS NULL
ON CONFLICT DO NOTHING;

-- Remove team membership rows superseded by author promotion
DELETE FROM "TeamMember" tm
USING "TeamAuthor" ta
WHERE tm."teamId" = ta."teamId" AND tm."userId" = ta."userId";

-- Drop all document write grants (authors are scope-level now)
DELETE FROM "DocumentGrantUser" WHERE "role" = 'Write';
DELETE FROM "DocumentGrantTeam" WHERE "role" = 'Write';
DELETE FROM "DocumentGrantDepartment" WHERE "role" = 'Write';
