-- Enforce one scope role per user: admin > company lead > department lead > team lead > team member.

-- 1. Platform administrators must not have organization assignments.
DELETE FROM "TeamMember"
WHERE "userId" IN (SELECT "id" FROM "User" WHERE "isAdmin" = true);

DELETE FROM "TeamLead"
WHERE "userId" IN (SELECT "id" FROM "User" WHERE "isAdmin" = true);

DELETE FROM "DepartmentLead"
WHERE "userId" IN (SELECT "id" FROM "User" WHERE "isAdmin" = true);

DELETE FROM "CompanyLead"
WHERE "userId" IN (SELECT "id" FROM "User" WHERE "isAdmin" = true);

-- 2. Company leads: remove lower org roles.
DELETE FROM "DepartmentLead"
WHERE "userId" IN (SELECT "userId" FROM "CompanyLead");

DELETE FROM "TeamLead"
WHERE "userId" IN (SELECT "userId" FROM "CompanyLead");

DELETE FROM "TeamMember"
WHERE "userId" IN (SELECT "userId" FROM "CompanyLead");

-- 3. Department leads: remove team roles.
DELETE FROM "TeamLead"
WHERE "userId" IN (SELECT "userId" FROM "DepartmentLead");

DELETE FROM "TeamMember"
WHERE "userId" IN (SELECT "userId" FROM "DepartmentLead");

-- 4. Team lead wins over team membership (same or different team).
DELETE FROM "TeamMember"
WHERE "userId" IN (SELECT "userId" FROM "TeamLead");

DELETE FROM "TeamMember" AS tm
USING "TeamLead" AS tl
WHERE tm."teamId" = tl."teamId" AND tm."userId" = tl."userId";

-- 5. At most one team lead per user (keep lexicographically smallest teamId).
DELETE FROM "TeamLead" AS tl1
WHERE EXISTS (
  SELECT 1
  FROM "TeamLead" AS tl2
  WHERE tl2."userId" = tl1."userId" AND tl2."teamId" < tl1."teamId"
);

-- 6. At most one team membership per user (keep lexicographically smallest teamId).
DELETE FROM "TeamMember" AS tm1
WHERE EXISTS (
  SELECT 1
  FROM "TeamMember" AS tm2
  WHERE tm2."userId" = tm1."userId" AND tm2."teamId" < tm1."teamId"
);
