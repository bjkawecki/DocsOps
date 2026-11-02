-- Do11y Phase 0: at most one lead row per team / department.
-- Keep the lexicographically smallest userId when duplicates exist.

DELETE FROM "TeamLead" AS tl1
USING "TeamLead" AS tl2
WHERE tl1."teamId" = tl2."teamId"
  AND tl1."userId" > tl2."userId";

DELETE FROM "DepartmentLead" AS dl1
USING "DepartmentLead" AS dl2
WHERE dl1."departmentId" = dl2."departmentId"
  AND dl1."userId" > dl2."userId";

ALTER TABLE "TeamLead" DROP CONSTRAINT "TeamLead_pkey";
ALTER TABLE "TeamLead" ADD CONSTRAINT "TeamLead_pkey" PRIMARY KEY ("teamId");
CREATE INDEX "TeamLead_userId_idx" ON "TeamLead"("userId");

ALTER TABLE "DepartmentLead" DROP CONSTRAINT "DepartmentLead_pkey";
ALTER TABLE "DepartmentLead" ADD CONSTRAINT "DepartmentLead_pkey" PRIMARY KEY ("departmentId");
CREATE INDEX "DepartmentLead_userId_idx" ON "DepartmentLead"("userId");
